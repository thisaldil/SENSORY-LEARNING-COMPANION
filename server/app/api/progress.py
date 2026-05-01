"""
Progress Tracking API Routes
"""
from datetime import datetime
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.audio_haptics.lesson import Lesson
from app.models.cognitive_load.quiz import QuizResult
from app.models.user import User
from app.utils.dependencies import get_current_user


router = APIRouter()


class UserProgressResponse(BaseModel):
    total_lessons_created: int
    lessons_in_progress: int
    lessons_completed: int
    avg_lesson_progress: float

    total_quizzes_taken: int
    avg_quiz_score: float
    last_quiz_score: Optional[float] = None
    last_quiz_date: Optional[datetime] = None

    last_active_date: Optional[datetime] = None


@router.get("/me", response_model=UserProgressResponse)
async def get_my_progress(current_user: User = Depends(get_current_user)):
    """
    Get aggregate progress summary for the current user.
    Combines lesson progress and quiz history into a single object for the dashboard.
    """
    try:
        user_id = PydanticObjectId(current_user.id)

        # Lessons for this user
        lessons = await Lesson.find({"user_id": user_id}).to_list()
        total_lessons = len(lessons)
        lessons_completed = sum(1 for l in lessons if l.progress >= 1.0)
        lessons_in_progress = sum(1 for l in lessons if 0.0 < l.progress < 1.0)
        avg_lesson_progress = (
            sum(l.progress for l in lessons) / total_lessons if total_lessons > 0 else 0.0
        )

        # Quiz results for this user
        quiz_results = await QuizResult.find({"user_id": user_id}).to_list()
        total_quizzes = len(quiz_results)
        avg_quiz_score = (
            sum(r.score for r in quiz_results) / total_quizzes if total_quizzes > 0 else 0.0
        )

        last_quiz = max(quiz_results, key=lambda r: r.completed_at) if quiz_results else None
        last_quiz_score = last_quiz.score if last_quiz else None
        last_quiz_date = last_quiz.completed_at if last_quiz else None

        last_lesson_update: Optional[datetime] = (
            max((l.updated_at for l in lessons), default=None) if lessons else None
        )

        # last active date = max(last lesson update, last quiz date)
        candidates = [d for d in [last_lesson_update, last_quiz_date] if d is not None]
        last_active_date = max(candidates) if candidates else None

        return UserProgressResponse(
            total_lessons_created=total_lessons,
            lessons_in_progress=lessons_in_progress,
            lessons_completed=lessons_completed,
            avg_lesson_progress=avg_lesson_progress,
            total_quizzes_taken=total_quizzes,
            avg_quiz_score=avg_quiz_score,
            last_quiz_score=last_quiz_score,
            last_quiz_date=last_quiz_date,
            last_active_date=last_active_date,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting progress: {str(e)}",
        )

