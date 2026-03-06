"""
Content Processing API Routes – including Adaptive Text Engine transmutation.
"""
from beanie import PydanticObjectId
from fastapi import APIRouter, status, Depends, HTTPException, Query

from app.schemas.nlp.adaptive_content import TransmuteRequest, TransmuteResponse
from app.services.nlp.adaptive_text_engine import log_transmutation_event
from app.models.user import User
from app.models.cognitive_load.content import TransmutedContent
from app.utils.dependencies import get_current_user


router = APIRouter()


@router.post("/process")
async def process_content():
    """Process text content into sensory lesson."""
    # TODO: Implement full multimodal content processing pipeline.
    return {"message": "Process content endpoint - TODO"}


@router.get("/status/{job_id}")
async def get_processing_status(job_id: str):
    """Check processing job status."""
    # TODO: Implement status check
    return {"message": f"Get processing status {job_id} endpoint - TODO"}


@router.post("/regenerate")
async def regenerate_content():
    """Regenerate specific content components."""
    # TODO: Implement content regeneration
    return {"message": "Regenerate content endpoint - TODO"}


@router.post(
    "/v1/transmute",
    response_model=TransmuteResponse,
    status_code=status.HTTP_200_OK,
)
async def transmute_endpoint(
    payload: TransmuteRequest,
    current_user: User = Depends(get_current_user),
) -> TransmuteResponse:
    """
    Adaptive Text Engine entrypoint for students.

    Body: { "text": "...", "cognitive_state": "OVERLOAD" | "OPTIMAL" | "LOW_LOAD", "session_id"?: "..." }

    Returns a single transmuted variant for the given state and logs one
    research-grade record into `transmuted_content`.
    """
    result = await log_transmutation_event(
        text=payload.text,
        cognitive_state=payload.cognitive_state,
        lesson_id=payload.lesson_id,
        student_id=str(current_user.id),
        session_id=payload.session_id,
    )
    return TransmuteResponse(**result)


@router.get(
    "/content/transmuted/latest",
    summary="Get latest TransmutedContent for a student (optional lesson)",
)
async def get_latest_transmuted_content(
    student_id: str = Query(..., description="Student ObjectId as string"),
    lesson_id: str | None = Query(
        None,
        description="Optional Lesson ObjectId as string to scope results",
    ),
):
    """
    Return the most recent `TransmutedContent` document for a given student.

    This is used by the frontend to fetch the latest Tier-3 bullets and cognitive
    state before calling the Neuro-Adaptive Visual Engine.
    """
    try:
        student_obj_id = PydanticObjectId(student_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student_id",
        )

    filters = [TransmutedContent.student_id == student_obj_id]
    if lesson_id:
        try:
            lesson_obj_id = PydanticObjectId(lesson_id)
            filters.append(TransmutedContent.lesson_id == lesson_obj_id)
        except Exception:
            # If lesson_id is malformed, treat as no results rather than 500
            filters.append(TransmutedContent.lesson_id == PydanticObjectId())

    doc = await TransmutedContent.find(*filters).sort("-created_at").first_or_none()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No transmuted content found for this student/lesson",
        )

    return doc
