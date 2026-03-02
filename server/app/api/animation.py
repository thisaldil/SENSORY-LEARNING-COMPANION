"""
Animation API – Visual Learning Platform.
GET /api/debug/test-generation, POST /api/animation/generate.
"""
import asyncio
import traceback

from fastapi import APIRouter, HTTPException, Query

from app.schemas.animation import AnimationRequest, AnimationResponse
from app.services.visual.cache_service import get_cached_script, is_script_valid, save_script
from app.services.visual import ai_generator
from app.services.visual.hybrid_generator import generate_hybrid_script_async

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
    """
    Generate or retrieve animation script for a concept.
    Flow: 1) Check MongoDB cache  2) Generate (hybrid or legacy)  3) Validate and cache  4) Return.
    """
    concept = (request.concept or "").strip()
    if not concept:
        raise HTTPException(status_code=400, detail="concept is required")

    concept_key = concept.lower()
    mode = (mode or "hybrid").lower()
    if mode not in ("hybrid", "legacy"):
        mode = "hybrid"

    cache_key = f"{concept_key}_{mode}"

    try:
        # 1. Check cache (with mode-specific key)
        cached = await get_cached_script(cache_key)
        if cached:
            return AnimationResponse(
                script=cached["script"],
                source=cached["source"],
                concept=concept_key,
            )

        # 2. Generate new script based on mode
        if mode == "hybrid":
            script = await generate_hybrid_script_async(concept)
        else:
            script = await asyncio.to_thread(ai_generator.generate_animation_script, concept)

        if not script:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate animation script using {mode} mode",
            )

        # 3. Validate script
        if not is_script_valid(script):
            raise HTTPException(status_code=500, detail="Generated script is invalid")

        # 4. Save to cache
        source = f"generated_{mode}"
        await save_script(cache_key, script, source)

        return AnimationResponse(
            script=script,
            source=source,
            concept=concept_key,
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error generating animation: {str(e)}. Check server logs for details.",
        )
