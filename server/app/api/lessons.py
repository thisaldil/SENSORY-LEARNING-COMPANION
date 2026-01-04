"""
Lessons API Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from beanie import PydanticObjectId
from app.models.user import User
from app.schemas.lesson import LessonCreate, LessonResponse
from app.services.lesson_service import create_lesson, get_lesson, lesson_to_response
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.post("", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson_endpoint(
    lesson_data: LessonCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new lesson"""
    try:
        user_id = PydanticObjectId(current_user.id)
        lesson = await create_lesson(user_id, lesson_data)
        return lesson_to_response(lesson)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating lesson: {str(e)}"
        )


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson_endpoint(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get lesson details"""
    try:
        lesson_obj_id = PydanticObjectId(lesson_id)
        user_id = PydanticObjectId(current_user.id)
        lesson = await get_lesson(lesson_obj_id, user_id)
        return lesson_to_response(lesson)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting lesson: {str(e)}"
        )
