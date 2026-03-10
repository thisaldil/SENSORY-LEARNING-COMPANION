"""
Demo Content Processing API Routes - Ollama-backed transmutation.

These routes are isolated for viva/demo use and do not change the existing
Gemini-backed production endpoints.
"""
from fastapi import APIRouter, status

from app.schemas.nlp.adaptive_content import TransmuteRequest, TransmuteResponse
from app.services.nlp.adaptive_text_engine_ollama_demo import transmute_text


router = APIRouter(prefix="/demo/nlp", tags=["Content Demo"])


@router.post(
    "/v1/transmute",
    response_model=TransmuteResponse,
    status_code=status.HTTP_200_OK,
    summary="Demo transmutation using local Ollama",
)
async def transmute_demo_endpoint(payload: TransmuteRequest) -> TransmuteResponse:
    """
    Demo-only Adaptive Text Engine endpoint.

    Body: { "text": "...", "cognitive_state": "OVERLOAD" | "OPTIMAL" | "LOW_LOAD" }
    """
    result = transmute_text(
        text=payload.text,
        cognitive_state=payload.cognitive_state,
    )
    return TransmuteResponse(**result)
