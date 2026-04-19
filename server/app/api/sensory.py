"""
Sensory Overlay API – Member 3

POST /api/sensory/overlay
POST /api/sensory/enrich-script
"""
from fastapi import APIRouter, HTTPException

from app.schemas.sensory_schemas import (
    SensoryOverlayRequest,
    SensoryOverlay,
    EnrichScriptRequest,
)
from app.services.sensory.multimodal_sync import (
    generate_and_log_sensory_overlay,
    enrich_script_with_sensory_overlay,
)

router = APIRouter()


def _resolve_cognitive_state(script: dict, explicit: str | None) -> str:
    """Extract cognitive_state from request or script meta."""
    if explicit and str(explicit).strip():
        return str(explicit).strip()
    meta = script.get("meta") or {}
    if isinstance(meta, dict):
        val = meta.get("cognitiveState") or meta.get("cognitive_state")
        if val:
            return str(val).strip()
    for scene in script.get("scenes") or []:
        if isinstance(scene, dict):
            m = scene.get("meta") or {}
            if isinstance(m, dict) and m.get("cognitiveState"):
                return str(m["cognitiveState"]).strip()
    return "OPTIMAL"


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
        skip_log=request.skip_log or False,
    )

    return SensoryOverlay(**overlay_dict)


@router.post(
    "/sensory/enrich-script",
    summary="Enrich visual script with per-scene audio and haptics",
)
async def enrich_script(request: EnrichScriptRequest) -> dict:
    """
    Accepts a visual AnimationScript JSON and returns the same script
    with per-scene `audio` and `haptics` added. Does not modify the
    neuro_adaptive_visual_scripts pipeline or persist to DB.
    """
    script = request.script or {}
    if not isinstance(script, dict) or "scenes" not in script:
        raise HTTPException(
            status_code=400,
            detail="script must be a valid AnimationScript with 'scenes'",
        )

    cognitive_state = _resolve_cognitive_state(script, request.cognitive_state)
    enriched = enrich_script_with_sensory_overlay(script, cognitive_state)
    return enriched


