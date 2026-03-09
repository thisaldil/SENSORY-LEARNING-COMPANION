"""
Animation API – Visual Learning Platform.
GET /api/debug/test-generation, POST /api/animation/generate.
"""
import asyncio
import traceback

from fastapi import APIRouter, HTTPException, Query

from app.schemas.visual.animation import (
    AnimationRequest,
    AnimationResponse,
    NeuroAdaptiveAnimationRequest,
    NeuroAdaptiveAnimationResponse,
)
from app.services.visual.cache_service import get_cached_script, is_script_valid, is_script_complete, save_script
from app.services.visual import ai_generator
from app.services.visual.hybrid_generator import generate_hybrid_script_async
from app.services.visual.prebuilt import get_prebuilt_script
from app.services.visual.neuro_adaptive_engine import (
    generate_neuro_adaptive_script,
    log_neuro_adaptive_script,
)
from app.models.visual.neuro_adaptive import NeuroAdaptiveVisualScript
from app.models.cognitive_load.content import TransmutedContent
from beanie import PydanticObjectId

router = APIRouter()


@router.get("/debug/test-generation")
async def test_generation():
    """Debug: verify Gemini client, model, and API key."""
    try:
        client = ai_generator.get_client()
        model = ai_generator._get_model_name()
        api_key_set = bool(ai_generator._get_api_key())
        return {
            "status": "ok",
            "client_initialized": True,
            "provider": "gemini",
            "model": model,
            "api_key_set": api_key_set,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "api_key_set": bool(ai_generator._get_api_key()),
            "traceback": traceback.format_exc(),
        }


@router.post("/animation/generate", response_model=AnimationResponse)
async def generate_animation(
    request: AnimationRequest,
    mode: str = Query("hybrid", description="Generation mode: 'hybrid' (default) or 'legacy'"),
):
    """Generate or retrieve animation script for a concept.

    Flow:
    1. Prebuilt (highest quality for known topics like water cycle)
    2. Cache by concept
    3. Comprehensive Gemini script (few-shot with water cycle exemplar)
    4. Hybrid rule-based fallback
    """
    concept = (request.concept or "").strip()
    if not concept:
        raise HTTPException(status_code=400, detail="concept is required")

    concept_key = concept.lower()

    try:
        # 1. Prebuilt scripts for well-known topics (e.g. water cycle)
        prebuilt = get_prebuilt_script(concept)
        if prebuilt is not None:
            return AnimationResponse(
                script=prebuilt,
                source="prebuilt",
                concept=concept_key,
            )

        # 2. Cache lookup by concept
        cached = await get_cached_script(concept_key)
        if cached:
            return AnimationResponse(
                script=cached["script"],
                source=cached["source"],
                concept=concept_key,
            )

        # 3. Comprehensive Gemini script (few-shot, highest quality)
        script = await asyncio.to_thread(ai_generator.generate_animation_script, concept, True)
        if script and is_script_complete(script):
            await save_script(concept_key, script, "generated_comprehensive")
            return AnimationResponse(
                script=script,
                source="generated_comprehensive",
                concept=concept_key,
            )

        # 4. Hybrid fallback (rule-based pipeline)
        script = await generate_hybrid_script_async(concept)
        if script and is_script_complete(script):
            await save_script(concept_key, script, "generated_hybrid")
            return AnimationResponse(
                script=script,
                source="generated_hybrid",
                concept=concept_key,
            )

        # 5. Last resort
        raise HTTPException(
            status_code=500,
            detail="Failed to generate animation script",
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error generating animation: {str(e)}. Check server logs for details.",
        )


@router.post(
    "/animation/neuro-adaptive",
    response_model=NeuroAdaptiveAnimationResponse,
    summary="Generate neuro-adaptive animation script from Tier 3 bullets + cognitive state",
)
async def generate_neuro_adaptive_animation(
    request: NeuroAdaptiveAnimationRequest,
):
    """
    Member 2 – Neuro-Adaptive Visual Engine.

    This endpoint consumes:
    - `transmuted_text`: Tier 3 bullet list from Member 1 (TransmutedContent.output.transmuted_text)
    - `cognitive_state`: OVERLOAD | OPTIMAL | LOW_LOAD (TransmutedContent.input.cognitive_state)

    and returns:
    - a JSON animation script (scenes + actors) that applies CTML principles to
      control visual salience and pacing based on the learner's load state.
    """
    transmuted_text = (request.transmuted_text or "").strip()
    if not transmuted_text:
        raise HTTPException(status_code=400, detail="transmuted_text is required")

    cognitive_state = (request.cognitive_state or "").strip()
    if not cognitive_state:
        raise HTTPException(status_code=400, detail="cognitive_state is required")

    concept = (request.concept or "").strip() or "Adaptive Visual Explanation"

    try:
        script = generate_neuro_adaptive_script(
            transmuted_text=transmuted_text,
            cognitive_state=cognitive_state,
            concept=concept,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error generating neuro-adaptive animation: {str(e)}",
        )

    # For now, this path is rule-based but still aligned with CTML
    # and existing AnimationScript JSON shape.
    from app.services.visual.neuro_adaptive_engine import _map_state_to_tier, _normalize_state

    state_norm = _normalize_state(cognitive_state)
    tier = _map_state_to_tier(state_norm)

    # Persist script if we have any identifying context
    if request.lesson_id or request.student_id or request.session_id:
        await log_neuro_adaptive_script(
            script,
            cognitive_state=state_norm,
            tier=tier,
            concept=concept,
            lesson_id=request.lesson_id,
            student_id=request.student_id,
            session_id=request.session_id,
        )

    return NeuroAdaptiveAnimationResponse(
        script=script,
        source="neuro_adaptive_rule_based",
        concept=concept,
        cognitive_state=state_norm,
        tier=tier,
        student_id=request.student_id,
        lesson_id=request.lesson_id,
        session_id=request.session_id,
    )


@router.get(
    "/animation/neuro-adaptive/latest",
    response_model=NeuroAdaptiveAnimationResponse,
    summary="Fetch latest neuro-adaptive visual script for a student (optional session)",
)
async def get_latest_neuro_adaptive_animation(
    student_id: str,
    session_id: str | None = None,
):
    """
    Return the most recent logged neuro-adaptive visual script for a given
    student (optionally scoped to a session).

    This deliberately ignores lesson_id so that visuals are keyed by
    student_id (+ optional session_id), matching the current research flow.
    """
    try:
        student_obj_id = PydanticObjectId(student_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid student_id",
        )

    # First try to fetch an already-logged visual script
    filters = [
        NeuroAdaptiveVisualScript.student_id == student_obj_id,
    ]
    if session_id is not None:
        filters.append(NeuroAdaptiveVisualScript.session_id == session_id)

    doc = await NeuroAdaptiveVisualScript.find(*filters).sort("-created_at").first_or_none()

    if doc:
        return NeuroAdaptiveAnimationResponse(
            script=doc.script,
            source="neuro_adaptive_logged",
            concept=doc.concept,
            cognitive_state=doc.cognitive_state,
            tier=doc.tier,
            student_id=str(doc.student_id) if doc.student_id else None,
            lesson_id=str(doc.lesson_id) if doc.lesson_id else None,
            session_id=doc.session_id,
        )

    # If no visual script exists yet, fall back to the latest TransmutedContent
    trans_filters = [TransmutedContent.student_id == student_obj_id]
    if session_id is not None:
        trans_filters.append(TransmutedContent.session_id == session_id)

    trans_doc = await TransmutedContent.find(*trans_filters).sort("-created_at").first_or_none()

    if not trans_doc:
        raise HTTPException(
            status_code=404,
            detail="No neuro-adaptive visual script or transmuted content found for this student/session",
        )

    # Derive inputs for the neuro-adaptive engine from the transmutation record
    transmuted_text = (trans_doc.output or {}).get("transmuted_text") or (trans_doc.input or {}).get("raw_text") or ""
    cognitive_state_raw = (trans_doc.input or {}).get("cognitive_state") or trans_doc.baseline_cognitive_load or "OPTIMAL"
    concept = trans_doc.topic or trans_doc.lesson_title or "Adaptive Visual Explanation"

    if not transmuted_text:
        raise HTTPException(
            status_code=500,
            detail="Transmuted content record is missing text for neuro-adaptive generation",
        )

    # Generate and log a new neuro-adaptive visual script on-demand
    from app.services.visual.neuro_adaptive_engine import _map_state_to_tier, _normalize_state

    state_norm = _normalize_state(cognitive_state_raw)
    tier = _map_state_to_tier(state_norm)
    script = generate_neuro_adaptive_script(
        transmuted_text=transmuted_text,
        cognitive_state=state_norm,
        concept=concept,
    )

    await log_neuro_adaptive_script(
        script,
        cognitive_state=state_norm,
        tier=tier,
        concept=concept,
        lesson_id=str(trans_doc.lesson_id) if trans_doc.lesson_id else None,
        student_id=student_id,
        session_id=session_id,
    )

    return NeuroAdaptiveAnimationResponse(
        script=script,
        source="neuro_adaptive_rule_based",
        concept=concept,
        cognitive_state=state_norm,
        tier=tier,
        student_id=student_id,
        lesson_id=str(trans_doc.lesson_id) if trans_doc.lesson_id else None,
        session_id=session_id,
    )
