"""
Voice cloning via Coqui TTS (XTTS v2).

Accepts text and a reference speaker WAV file; returns synthesized WAV bytes
in the cloned voice. Uses a single lazy-loaded model instance.
"""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Optional

# Lazy model instance
_tts_model = None


def _get_model():
    """Lazy-load XTTS v2 model (supports voice cloning from speaker_wav)."""
    global _tts_model
    if _tts_model is not None:
        return _tts_model
    import torch
    from TTS.api import TTS

    device = "cuda" if torch.cuda.is_available() else "cpu"
    _tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    return _tts_model


def synthesize_cloned(
    text: str,
    speaker_wav_path: str | Path,
    language: str = "en",
) -> bytes:
    """
    Synthesize speech from text using a cloned voice from the reference WAV.

    Args:
        text: Text to speak.
        speaker_wav_path: Path to a WAV file (or list of paths) for the reference voice.
        language: Language code (e.g. "en", "es").

    Returns:
        WAV file bytes (16-bit PCM).
    """
    if not (text or "").strip():
        return b""

    path = Path(speaker_wav_path)
    if not path.is_file():
        raise FileNotFoundError(f"Speaker WAV not found: {speaker_wav_path}")

    model = _get_model()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        out_path = f.name
    try:
        model.tts_to_file(
            text=text.strip(),
            speaker_wav=str(path),
            file_path=out_path,
            language=language,
        )
        with open(out_path, "rb") as f:
            return f.read()
    finally:
        Path(out_path).unlink(missing_ok=True)


def synthesize_cloned_from_bytes(
    text: str,
    speaker_wav_bytes: bytes,
    language: str = "en",
) -> bytes:
    """
    Same as synthesize_cloned but accepts speaker audio as bytes (e.g. from an upload).
    Writes bytes to a temp file and delegates to synthesize_cloned.
    """
    if not speaker_wav_bytes:
        raise ValueError("Speaker WAV bytes are empty")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(speaker_wav_bytes)
        path = f.name
    try:
        return synthesize_cloned(text=text, speaker_wav_path=path, language=language)
    finally:
        Path(path).unlink(missing_ok=True)
