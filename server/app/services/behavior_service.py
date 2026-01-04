"""
Behavior Logging Service
Service for logging student behavior and predicting cognitive load
"""
from typing import Dict, List, Optional
from datetime import datetime
from beanie import PydanticObjectId
from app.models.behavior import BehaviorLog
from app.models.quiz import Quiz, QuizResult
from app.ml.processors.feature_extractor import extract_features_from_behavior_log
from app.ml.processors.cognitive_load_predictor import predict_cognitive_load


async def create_behavior_log(
    quiz_id: PydanticObjectId,
    user_id: PydanticObjectId,
    lesson_id: PydanticObjectId,
    session_data: Dict
) -> BehaviorLog:
    """
    Create a behavior log from session data
    
    Args:
        quiz_id: ID of the quiz
        user_id: ID of the user
        lesson_id: ID of the lesson
        session_data: Dictionary containing session interaction data
        
    Returns:
        BehaviorLog document
    """
    # Get quiz to calculate metrics
    quiz = await Quiz.get(quiz_id)
    total_questions = len(quiz.questions) if quiz else session_data.get('total_questions', 0)
    
    # Extract timing data
    session_started = session_data.get('session_started')
    if isinstance(session_started, str):
        try:
            # Handle ISO format with Z
            if session_started.endswith('Z'):
                session_started = session_started[:-1] + '+00:00'
            session_started = datetime.fromisoformat(session_started.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            session_started = datetime.utcnow()
    elif session_started is None:
        session_started = datetime.utcnow()
    
    session_completed = session_data.get('session_completed')
    if session_completed and isinstance(session_completed, str):
        try:
            if session_completed.endswith('Z'):
                session_completed = session_completed[:-1] + '+00:00'
            session_completed = datetime.fromisoformat(session_completed.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            session_completed = None
    
    total_time = session_data.get('total_time_seconds', 0)
    
    # Extract question interactions
    question_interactions = session_data.get('question_interactions', [])
    
    # Calculate metrics
    questions_answered = len([q for q in question_interactions if q.get('answer_index') is not None])
    questions_skipped = total_questions - questions_answered
    
    # Calculate time metrics
    times = [q.get('time_spent_seconds', 0) for q in question_interactions if q.get('time_spent_seconds')]
    avg_time = sum(times) / len(times) if times else 0
    longest_time = max(times) if times else 0
    shortest_time = min(times) if times else 0
    
    # Calculate answer correctness (if quiz result exists)
    correct_answers = 0
    incorrect_answers = 0
    
    # Get quiz result if it exists
    quiz_result = await QuizResult.find_one(
        QuizResult.quiz_id == quiz_id,
        QuizResult.user_id == user_id
    )
    
    if quiz_result:
        correct_answers = quiz_result.correct_count
        incorrect_answers = quiz_result.total_questions - quiz_result.correct_count
    
    accuracy_rate = (
        correct_answers / (correct_answers + incorrect_answers)
        if (correct_answers + incorrect_answers) > 0 else 0
    )
    
    # Create behavior log
    behavior_log = BehaviorLog(
        quiz_id=quiz_id,
        user_id=user_id,
        lesson_id=lesson_id,
        session_started=session_started,
        session_completed=session_completed,
        total_time_seconds=total_time,
        question_interactions=question_interactions,
        total_questions=total_questions,
        questions_answered=questions_answered,
        questions_skipped=questions_skipped,
        average_time_per_question=avg_time,
        longest_time_question=longest_time,
        shortest_time_question=shortest_time,
        back_navigations=session_data.get('back_navigations', 0),
        forward_navigations=session_data.get('forward_navigations', 0),
        answer_changes=session_data.get('answer_changes', 0),
        correct_answers=correct_answers,
        incorrect_answers=incorrect_answers,
        accuracy_rate=accuracy_rate
    )
    
    # Extract features and predict cognitive load
    try:
        behavior_dict = behavior_log.model_dump()
        features = extract_features_from_behavior_log(behavior_dict)
        predicted_load, confidence = predict_cognitive_load(features)
        
        behavior_log.predicted_cognitive_load = predicted_load
        behavior_log.cognitive_load_confidence = confidence
    except Exception as e:
        print(f"⚠️  Error predicting cognitive load: {str(e)}")
        # Continue without prediction if model not available
    
    # Save to database
    await behavior_log.insert()
    
    return behavior_log


async def get_behavior_log(
    quiz_id: PydanticObjectId,
    user_id: PydanticObjectId
) -> Optional[BehaviorLog]:
    """
    Get behavior log for a quiz session
    
    Args:
        quiz_id: ID of the quiz
        user_id: ID of the user
        
    Returns:
        BehaviorLog document or None
    """
    return await BehaviorLog.find_one(
        BehaviorLog.quiz_id == quiz_id,
        BehaviorLog.user_id == user_id
    )


async def update_behavior_log_with_results(
    quiz_id: PydanticObjectId,
    user_id: PydanticObjectId
) -> Optional[BehaviorLog]:
    """
    Update behavior log with quiz results and recalculate cognitive load
    
    Args:
        quiz_id: ID of the quiz
        user_id: ID of the user
        
    Returns:
        Updated BehaviorLog document
    """
    behavior_log = await get_behavior_log(quiz_id, user_id)
    if not behavior_log:
        return None
    
    # Get quiz result
    quiz_result = await QuizResult.find_one(
        QuizResult.quiz_id == quiz_id,
        QuizResult.user_id == user_id
    )
    
    if quiz_result:
        # Update metrics
        behavior_log.correct_answers = quiz_result.correct_count
        behavior_log.incorrect_answers = quiz_result.total_questions - quiz_result.correct_count
        behavior_log.accuracy_rate = (
            quiz_result.correct_count / quiz_result.total_questions
            if quiz_result.total_questions > 0 else 0
        )
        
        # Update session completion
        if not behavior_log.session_completed:
            behavior_log.session_completed = quiz_result.completed_at
        
        # Recalculate cognitive load with updated data
        try:
            behavior_dict = behavior_log.model_dump()
            features = extract_features_from_behavior_log(behavior_dict)
            predicted_load, confidence = predict_cognitive_load(features)
            
            behavior_log.predicted_cognitive_load = predicted_load
            behavior_log.cognitive_load_confidence = confidence
        except Exception as e:
            print(f"⚠️  Error predicting cognitive load: {str(e)}")
        
        behavior_log.updated_at = datetime.utcnow()
        await behavior_log.save()
    
    return behavior_log

