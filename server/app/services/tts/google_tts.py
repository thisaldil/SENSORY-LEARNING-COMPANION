"""
Google Cloud Text-to-Speech – cognitive-load-aware narration for Member 3.

Uses GOOGLE_APPLICATION_CREDENTIALS (path to service account credentials.json).
Speech rate is mapped from overlay.speech_rate: slow | normal | fast.
"""

from __future__ import annotations

import os
from typing import Literal

from app.config import settings

SpeechRate = Literal["slow", "normal", "fast"]

# Google TTS speaking_rate: 0.25–4.0, 1.0 = normal
RATE_MAP: dict[SpeechRate, float] = {
    "slow": 0.85,
    "normal": 1.0,
    "fast": 1.15,
}

_client = None


def _get_client():
    """Lazy-init Google Cloud TTS client. Uses GOOGLE_APPLICATION_CREDENTIALS."""
    global _client
    if _client is not None:
        return _client
    creds_path = getattr(settings, "GOOGLE_APPLICATION_CREDENTIALS", None) or os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS", ""
    )
    if creds_path and os.path.isfile(creds_path):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path
    from google.cloud import texttospeech

    _client = texttospeech.TextToSpeechClient()
    return _client


def synthesize(
    text: str,
    speech_rate: SpeechRate = "normal",
    language_code: str = "en-US",
    voice_name: str = "en-US-Neural2-D",
) -> bytes:
    """
    Synthesize speech from text. Returns MP3 bytes.

    speech_rate: from overlay.speech_rate (cognitive-load-driven: slow / normal / fast).
    """
    from google.cloud import texttospeech

    if not (text or "").strip():
        return b""

    client = _get_client()
    rate = RATE_MAP.get(speech_rate, 1.0)

    synthesis_input = texttospeech.SynthesisInput(text=text.strip())
    voice = texttospeech.VoiceSelectionParams(
        language_code=language_code,
        name=voice_name,
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=rate,
    )

    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config,
    )
    return response.audio_content
