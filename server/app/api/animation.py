"""
Animation API – Visual Learning Platform.
GET /api/debug/test-generation, POST /api/animation/generate.
"""
import asyncio
import traceback

from fastapi import APIRouter, HTTPException, Query

from app.schemas.animation import AnimationRequest, AnimationResponse
from app.services.visual.cache_service import get_cached_script, is_script_valid, is_script_complete, save_script
from app.services.visual import ai_generator
from app.services.visual.hybrid_generator import generate_hybrid_script_async
from app.services.visual.prebuilt import get_prebuilt_script

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
