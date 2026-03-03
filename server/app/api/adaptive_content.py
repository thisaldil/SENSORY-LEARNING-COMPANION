"""
Adaptive Content API – Content Mapping Logic
"""
from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status

from app.schemas.adaptive_content import AdaptiveContentRequest, AdaptiveContentResponse
from app.services.content_service import get_content_for_state


router = APIRouter()


@router.post(
    "/v1/content/next",
    response_model=AdaptiveContentResponse,
    status_code=status.HTTP_200_OK,
)
async def get_next_content(payload: AdaptiveContentRequest):
    """
    Return the next content variant for a lesson given the current load state.

    The app typically calls this immediately after receiving a state from
    /api/v1/predict.
    """
    try:
        lesson_obj_id = PydanticObjectId(payload.lesson_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lesson_id",
        )

    content_json = await get_content_for_state(
        lesson_id=lesson_obj_id,
        state=payload.state,
        concept_id=payload.concept_id,
    )
    if content_json is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No adaptive content found for this lesson/state",
        )

    return AdaptiveContentResponse(
        lesson_id=payload.lesson_id,
        concept_id=payload.concept_id,
        state=payload.state,
        content=content_json,
    )

