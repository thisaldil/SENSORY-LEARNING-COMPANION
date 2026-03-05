"""
Lessons API Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import JSONResponse
from beanie import PydanticObjectId
from typing import Optional

from app.models.user import User
from app.models.audio_haptics.lesson import Lesson
from app.models.activity import Activity
from app.schemas.audio_haptics.lesson import LessonCreate, LessonResponse
from app.services.lesson_service import create_lesson, get_lesson, lesson_to_response
from app.utils.dependencies import get_current_user
from app.utils.topic_inference import infer_topics_from_lesson, infer_cognitive_load_from_lesson
from app.api.activities import build_activity_query, _activity_to_response

router = APIRouter()


@router.get("/{lesson_id}/activities", response_class=JSONResponse)
async def get_lesson_activities(
    lesson_id: str,
    cognitive_load: Optional[str] = Query(None, description="Filter by cognitive load: LOW, MEDIUM, HIGH"),
    activity_type: Optional[str] = Query(None, description="Filter by type: TRUE_FALSE, MCQ, MATCHING, FILL_BLANK_WORD_BANK"),
    current_user: User = Depends(get_current_user),
):
    """
    Get activities filtered by this lesson's content: topic and cognitive load are inferred
    from the lesson's subject and content. Use this after the user has created/opened a lesson.

    - Topic: inferred from subject and first part of content.
    - Cognitive load: inferred from content length and sentence complexity when not provided.
    Optional query params: cognitive_load, activity_type (override inferred cognitive load if provided).
    """
    try:
        lesson_obj_id = PydanticObjectId(lesson_id)
        user_id = PydanticObjectId(current_user.id)
        lesson = await get_lesson(lesson_obj_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    topics = infer_topics_from_lesson(lesson)
    # Use query param if provided, otherwise infer from lesson content
    cognitive_load_to_use = cognitive_load
    if not cognitive_load_to_use or not cognitive_load_to_use.strip():
        cognitive_load_to_use = infer_cognitive_load_from_lesson(lesson)

    query = build_activity_query(
        topics_any=topics if topics else None,
        cognitive_load=cognitive_load_to_use,
        activity_type=activity_type,
    )
    # If no topics inferred, return all activities (optional: restrict by subject only)
    if not query:
        query = {}
    cursor = Activity.find(query)
    activities = await cursor.to_list()

    # Fallback: if client passed cognitive_load (or we inferred it) and got 0 results,
    # retry without cognitive_load so user still sees topic-matched activities
    if not activities and cognitive_load_to_use:
        query_fallback = build_activity_query(
            topics_any=topics if topics else None,
            cognitive_load=None,
            activity_type=activity_type,
        )
        if query_fallback:
            cursor = Activity.find(query_fallback)
            activities = await cursor.to_list()

    result = [_activity_to_response(a) for a in activities]
    return JSONResponse(content=result, media_type="application/json")


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
