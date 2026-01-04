"""
Lesson Service
Service layer for lesson management
"""
from beanie import PydanticObjectId
from app.models.lesson import Lesson
from app.schemas.lesson import LessonCreate, LessonResponse


def lesson_to_response(lesson: Lesson) -> LessonResponse:
    """Convert Lesson document to LessonResponse schema"""
    lesson_dict = lesson.model_dump()
    lesson_dict["id"] = str(lesson.id)
    lesson_dict["user_id"] = str(lesson.user_id)
    lesson_dict.pop("_id", None)
    return LessonResponse.model_validate(lesson_dict)


async def create_lesson(
    user_id: PydanticObjectId,
    lesson_data: LessonCreate
) -> Lesson:
    """
    Create a new lesson
    
    Args:
        user_id: ID of the user creating the lesson
        lesson_data: Lesson creation data
        
    Returns:
        Lesson document
    """
    lesson = Lesson(
        user_id=user_id,
        title=lesson_data.title,
        subject=lesson_data.subject,
        content=lesson_data.content
    )
    
    await lesson.insert()
    return lesson


async def get_lesson(
    lesson_id: PydanticObjectId,
    user_id: PydanticObjectId
) -> Lesson:
    """
    Get a lesson by ID
    
    Args:
        lesson_id: ID of the lesson
        user_id: ID of the user
        
    Returns:
        Lesson document
        
    Raises:
        ValueError: If lesson not found or doesn't belong to user
    """
    lesson = await Lesson.get(lesson_id)
    if not lesson:
        raise ValueError(f"Lesson with ID {lesson_id} not found")
    
    if lesson.user_id != user_id:
        raise ValueError("Lesson does not belong to user")
    
    return lesson
