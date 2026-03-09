"""
TTS API – Google Cloud Text-to-Speech for Member 3 narration.

POST /api/tts/synthesize
Body: { "text": string, "speech_rate": "slow" | "normal" | "fast" }
Returns: audio/mpeg (MP3 bytes)
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.services.tts.google_tts import synthesize
from app.services.tts.google_tts import SpeechRate

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    speech_rate: SpeechRate = "normal"


@router.post(
    "/tts/synthesize",
    response_class=Response,
    summary="Synthesize narration audio (Google Cloud TTS)",
)
def tts_synthesize(request: TTSRequest):
    """
    Returns MP3 audio for the given text. Use overlay.speech_rate from
    POST /api/sensory/overlay for cognitive-load-adapted pacing.
    """
    try:
        audio_bytes = synthesize(
            text=request.text,
            speech_rate=request.speech_rate,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"TTS synthesis failed: {str(e)}. Ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account JSON.",
        )
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty text")
    return Response(content=audio_bytes, media_type="audio/mpeg")
