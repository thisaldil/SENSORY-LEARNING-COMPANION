"""
Sensory Overlay API – Member 3

POST /api/sensory/overlay
"""
from fastapi import APIRouter, HTTPException

from app.schemas.sensory_schemas import (
    SensoryOverlayRequest,
    SensoryOverlay,
)
from app.services.sensory.multimodal_sync import generate_and_log_sensory_overlay

router = APIRouter()


@router.post(
    "/sensory/overlay",
    response_model=SensoryOverlay,
    summary="Generate audio + haptic overlay from a visual AnimationScript",
)
async def create_sensory_overlay(request: SensoryOverlayRequest) -> SensoryOverlay:
    script = request.script or {}
    if not isinstance(script, dict) or "scenes" not in script:
        raise HTTPException(status_code=400, detail="script must be a valid AnimationScript JSON")

    cognitive_state = (request.cognitive_state or "").strip()
    if not cognitive_state:
        raise HTTPException(status_code=400, detail="cognitive_state is required")

    overlay_dict = await generate_and_log_sensory_overlay(
        script=script,
        cognitive_state=cognitive_state,
        concept=request.concept,
        lesson_id=request.lesson_id,
        student_id=request.student_id,
        session_id=request.session_id,
    )

    return SensoryOverlay(**overlay_dict)


