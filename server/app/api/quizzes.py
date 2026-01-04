"""
Quizzes API Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from beanie import PydanticObjectId
from app.models.user import User
from app.models.quiz import Quiz, QuizResult
from app.schemas.quiz import (
    QuizGenerateRequest,
    QuizSubmitRequest,
    QuizResponse,
    QuizResultResponse
)
from app.services.quiz_generator import (
    generate_quiz_for_lesson,
    get_quiz as get_quiz_service,
    submit_quiz_answers,
    get_quiz_result
)
from app.services.behavior_service import get_behavior_log
from app.utils.dependencies import get_current_user
import json

router = APIRouter()


def quiz_to_response(quiz: Quiz) -> QuizResponse:
    """Convert Quiz document to QuizResponse schema"""
    quiz_dict = quiz.model_dump()
    quiz_dict["id"] = str(quiz.id)
    quiz_dict["lesson_id"] = str(quiz.lesson_id)
    quiz_dict["user_id"] = str(quiz.user_id)
    quiz_dict.pop("_id", None)
    return QuizResponse.model_validate(quiz_dict)


async def quiz_result_to_response(result: QuizResult) -> QuizResultResponse:
    """Convert QuizResult document to QuizResultResponse schema"""
    result_dict = result.model_dump()
    result_dict["id"] = str(result.id)
    result_dict["quiz_id"] = str(result.quiz_id)
    result_dict["user_id"] = str(result.user_id)
    result_dict.pop("_id", None)
    
    # Cognitive load is now stored directly in QuizResult
    # If not present, try to get from behavior log as fallback
    if not result_dict.get("cognitive_load"):
        behavior_log = await get_behavior_log(result.quiz_id, result.user_id)
        if behavior_log:
            result_dict["cognitive_load"] = behavior_log.predicted_cognitive_load
            result_dict["cognitive_load_confidence"] = behavior_log.cognitive_load_confidence
    
    return QuizResultResponse.model_validate(result_dict)


@router.post("/generate", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate quiz from lesson
    
    Creates 10 quiz questions based on the lesson content.
    """
    try:
        lesson_id = PydanticObjectId(request.lesson_id)
        user_id = PydanticObjectId(current_user.id)
        
        quiz = await generate_quiz_for_lesson(
            lesson_id=lesson_id,
            user_id=user_id,
            num_questions=10
        )
        
        return quiz_to_response(quiz)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating quiz: {str(e)}"
        )


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get quiz details
    
    Returns the quiz with all questions including correct answers.
    """
    try:
        quiz_obj_id = PydanticObjectId(quiz_id)
        user_id = PydanticObjectId(current_user.id)
        
        quiz = await get_quiz_service(quiz_obj_id, user_id)
        
        # Return quiz with correct answers included
        return quiz_to_response(quiz)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting quiz: {str(e)}"
        )


@router.post("/{quiz_id}/submit", response_model=QuizResultResponse, status_code=status.HTTP_201_CREATED)
async def submit_quiz(
    quiz_id: str,
    request_body: QuizSubmitRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submit quiz answers
    
    Submits answers for a quiz and calculates the score.
    """
    try:
        quiz_obj_id = PydanticObjectId(quiz_id)
        user_id = PydanticObjectId(current_user.id)
        
        # Convert Pydantic models to dicts
        answers_dict = [ans.model_dump() for ans in request_body.answers]
        
        # Convert behavior data if provided
        behavior_data = None
        if request_body.behavior_data:
            behavior_data = request_body.behavior_data.model_dump()
        
        # Convert cognitive load features if provided
        cognitive_load_features = None
        if request_body.cognitive_load_features:
            cognitive_load_features = request_body.cognitive_load_features.model_dump()
        
        result = await submit_quiz_answers(
            quiz_id=quiz_obj_id,
            user_id=user_id,
            answers=answers_dict,
            behavior_data=behavior_data,
            cognitive_load_features=cognitive_load_features
        )
        
        return await quiz_result_to_response(result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting quiz: {str(e)}"
        )


@router.get("/{quiz_id}/results", response_model=QuizResultResponse)
async def get_quiz_results(
    quiz_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get quiz results
    
    Retrieves the results for a completed quiz.
    """
    try:
        quiz_obj_id = PydanticObjectId(quiz_id)
        user_id = PydanticObjectId(current_user.id)
        
        result = await get_quiz_result(quiz_obj_id, user_id)
        
        return await quiz_result_to_response(result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting quiz results: {str(e)}"
        )
