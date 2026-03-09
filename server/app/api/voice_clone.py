"""
Voice cloning API – Coqui TTS (XTTS v2).

POST /tts/voice-clone
  Form: text (str), speaker_wav (WAV file upload)
  Returns: audio/wav (generated WAV bytes)

GET /tts/health
  Returns: {"status": "ok"} for liveness.
"""

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import Response

from app.services.tts.voice_cloning import synthesize_cloned_from_bytes

router = APIRouter(prefix="/tts", tags=["Voice cloning"])


@router.get("/health")
def health():
    """Liveness/readiness for the voice-clone service."""
    return {"status": "ok"}


@router.post(
    "/voice-clone",
    response_class=Response,
    summary="Synthesize speech in a cloned voice",
)
async def voice_clone(
    text: str = Form(..., description="Text to speak in the cloned voice"),
    speaker_wav: UploadFile = File(..., description="Reference WAV file for the voice to clone"),
    language: str = Form("en", description="Language code (e.g. en, es)"),
):
    """
    Clone the voice from the uploaded WAV and synthesize the given text.
    Returns the generated audio as a WAV file.
    """
    if not (text or "").strip():
        raise HTTPException(status_code=400, detail="text is required and cannot be empty")

    # Optional: restrict to WAV
    content_type = (speaker_wav.content_type or "").lower()
    if content_type and "wav" not in content_type and "audio" not in content_type:
        raise HTTPException(
            status_code=400,
            detail="speaker_wav should be a WAV audio file",
        )

    try:
        speaker_bytes = await speaker_wav.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read speaker_wav: {e}") from e

    if not speaker_bytes:
        raise HTTPException(status_code=400, detail="speaker_wav file is empty")

    try:
        wav_bytes = synthesize_cloned_from_bytes(
            text=text.strip(),
            speaker_wav_bytes=speaker_bytes,
            language=language.strip() or "en",
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Voice cloning failed: {str(e)}. Ensure coqui-tts and dependencies are installed.",
        ) from e

    if not wav_bytes:
        raise HTTPException(status_code=500, detail="Generated audio is empty")

    return Response(content=wav_bytes, media_type="audio/wav")
