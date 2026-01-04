"""
Quiz Generation Service
Service layer for quiz generation and management
"""
from typing import List, Dict, Optional
from beanie import PydanticObjectId
from app.models.lesson import Lesson
from app.models.quiz import Quiz, QuizResult
from app.ml.processors.quiz_generator import generate_quiz_from_content
from app.ml.processors.cognitive_load_predictor import predict_cognitive_load
from app.services.behavior_service import (
    create_behavior_log,
    update_behavior_log_with_results
)


async def generate_quiz_for_lesson(
    lesson_id: PydanticObjectId,
    user_id: PydanticObjectId,
    num_questions: int = 10
) -> Quiz:
    """
    Generate a quiz for a given lesson
    
    Args:
        lesson_id: ID of the lesson
        user_id: ID of the user
        num_questions: Number of questions to generate (default: 10)
        
    Returns:
        Quiz document
        
    Raises:
        ValueError: If lesson not found
    """
    # Get lesson
    lesson = await Lesson.get(lesson_id)
    if not lesson:
        raise ValueError(f"Lesson with ID {lesson_id} not found")
    
    # Verify lesson belongs to user
    if lesson.user_id != user_id:
        raise ValueError("Lesson does not belong to user")
    
    # Generate questions from lesson content
    questions = generate_quiz_from_content(lesson.content, num_questions)
    
    # Create quiz document
    quiz = Quiz(
        lesson_id=lesson_id,
        user_id=user_id,
        questions=questions
    )
    
    # Save to database
    await quiz.insert()
    
    return quiz


async def get_quiz(quiz_id: PydanticObjectId, user_id: PydanticObjectId) -> Quiz:
    """
    Get a quiz by ID
    
    Args:
        quiz_id: ID of the quiz
        user_id: ID of the user
        
    Returns:
        Quiz document
        
    Raises:
        ValueError: If quiz not found or doesn't belong to user
    """
    quiz = await Quiz.get(quiz_id)
    if not quiz:
        raise ValueError(f"Quiz with ID {quiz_id} not found")
    
    if quiz.user_id != user_id:
        raise ValueError("Quiz does not belong to user")
    
    return quiz


async def submit_quiz_answers(
    quiz_id: PydanticObjectId,
    user_id: PydanticObjectId,
    answers: List[Dict],
    behavior_data: Optional[Dict] = None,
    cognitive_load_features: Optional[Dict] = None
) -> QuizResult:
    """
    Submit quiz answers and calculate score
    
    Args:
        quiz_id: ID of the quiz
        user_id: ID of the user
        answers: List of answer dictionaries with 'question_id' and 'answer_index'
        behavior_data: Optional behavior data for logging
        cognitive_load_features: Optional raw features for cognitive load prediction
        
    Returns:
        QuizResult document
        
    Raises:
        ValueError: If quiz not found or answers invalid
    """
    # Get quiz
    quiz = await get_quiz(quiz_id, user_id)
    
    # Calculate score
    correct_count = 0
    total_questions = len(quiz.questions)
    
    # Create answer map for quick lookup
    # Handle both dict and Pydantic model formats
    answer_map = {}
    for ans in answers:
        if isinstance(ans, dict):
            answer_map[ans.get('question_id')] = ans.get('answer_index')
        else:
            # Pydantic model
            answer_map[ans.question_id] = ans.answer_index
    
    # Check each question
    for question in quiz.questions:
        question_id = question.get('id')
        user_answer = answer_map.get(question_id)
        correct_answer = question.get('correct_index')
        
        if user_answer is not None and user_answer == correct_answer:
            correct_count += 1
    
    # Calculate score (percentage)
    score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    
    # Convert answers to dict format for storage
    answers_dict = []
    for ans in answers:
        if isinstance(ans, dict):
            answers_dict.append(ans)
        else:
            answers_dict.append({
                'question_id': ans.question_id,
                'answer_index': ans.answer_index
            })
    
    # Predict cognitive load if features provided
    cognitive_load = None
    cognitive_load_confidence = None
    if cognitive_load_features:
        try:
            # Convert Pydantic model to dict if needed
            if hasattr(cognitive_load_features, 'model_dump'):
                features_dict = cognitive_load_features.model_dump()
            else:
                features_dict = cognitive_load_features
            
            # Calculate totalScore and accuracyRate from quiz results if not provided
            # or override with calculated values to ensure consistency
            features_dict['totalScore'] = float(correct_count)
            features_dict['accuracyRate'] = float(correct_count / total_questions) if total_questions > 0 else 0.0
            
            # Predict cognitive load using the model
            predicted_load, confidence, confidence_scores = predict_cognitive_load(features_dict)
            cognitive_load = predicted_load
            cognitive_load_confidence = confidence
            print(f"✅ Predicted cognitive load: {cognitive_load} (confidence: {confidence:.4f})")
            print(f"   Confidence scores: Low={confidence_scores['Low']:.2%}, Medium={confidence_scores['Medium']:.2%}, High={confidence_scores['High']:.2%}")
        except Exception as e:
            print(f"⚠️  Error predicting cognitive load: {str(e)}")
            # Continue without prediction if model fails
    
    # Create quiz result
    result = QuizResult(
        quiz_id=quiz_id,
        user_id=user_id,
        answers=answers_dict,
        score=score,
        correct_count=correct_count,
        total_questions=total_questions,
        cognitive_load=cognitive_load,
        cognitive_load_confidence=cognitive_load_confidence
    )
    
    # Save to database
    await result.insert()
    
    # Log behavior data if provided
    if behavior_data:
        try:
            # Get lesson_id from quiz
            quiz = await get_quiz(quiz_id, user_id)
            lesson_id = quiz.lesson_id
            
            # Convert behavior_data to dict if it's a Pydantic model
            if hasattr(behavior_data, 'model_dump'):
                behavior_dict = behavior_data.model_dump()
            else:
                behavior_dict = behavior_data
            
            # Add question interactions from answers if not provided
            if 'question_interactions' not in behavior_dict or not behavior_dict['question_interactions']:
                behavior_dict['question_interactions'] = []
                for ans in answers:
                    if isinstance(ans, dict):
                        behavior_dict['question_interactions'].append({
                            'question_id': ans.get('question_id'),
                            'answer_index': ans.get('answer_index')
                        })
            
            # Create or update behavior log
            await create_behavior_log(
                quiz_id=quiz_id,
                user_id=user_id,
                lesson_id=lesson_id,
                session_data=behavior_dict
            )
            
            # Update behavior log with quiz results
            await update_behavior_log_with_results(quiz_id, user_id)
        except Exception as e:
            print(f"⚠️  Error logging behavior: {str(e)}")
            # Continue even if behavior logging fails
    
    return result


async def get_quiz_result(
    quiz_id: PydanticObjectId,
    user_id: PydanticObjectId
) -> QuizResult:
    """
    Get quiz result for a quiz
    
    Args:
        quiz_id: ID of the quiz
        user_id: ID of the user
        
    Returns:
        QuizResult document
        
    Raises:
        ValueError: If result not found
    """
    result = await QuizResult.find_one(
        QuizResult.quiz_id == quiz_id,
        QuizResult.user_id == user_id
    )
    
    if not result:
        raise ValueError(f"Quiz result for quiz {quiz_id} not found")
    
    return result
