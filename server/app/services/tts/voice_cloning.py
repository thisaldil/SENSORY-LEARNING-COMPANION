"""
Voice cloning via Coqui TTS (XTTS v2).

Accepts text and a reference speaker WAV file; returns synthesized WAV bytes
in the cloned voice. Uses a single lazy-loaded model instance.

Run standalone: python -m app.services.tts.voice_cloning (with a small main block).
Requires: coqui-tts, torch, transformers. Optional: set COQUI_TOS_AGREED=1 to skip prompt.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

# Accept Coqui CPML (non-commercial) so the app can run without prompting [y/n]
os.environ.setdefault("COQUI_TOS_AGREED", "1")

# Mac / transformers: patch before any TTS import (TTS imports transformers.pytorch_utils.isin_mps_friendly)
import torch
import transformers
if not hasattr(transformers.pytorch_utils, "isin_mps_friendly"):
    transformers.pytorch_utils.isin_mps_friendly = torch.isin

# Lazy model instance
_tts_model = None


def _get_model():
    """Lazy-load XTTS v2 model (supports voice cloning from speaker_wav)."""
    global _tts_model
    if _tts_model is not None:
        return _tts_model
    from TTS.api import TTS

    # Use CPU when CUDA not available (avoids MPS/experimental GPU math bugs on Mac)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    _tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    return _tts_model


def synthesize_cloned(
    text: str,
    speaker_wav_path: str | Path,
    language: str = "en",
    *,
    tts=None,
) -> bytes:
    """
    Synthesize speech from text using a cloned voice from the reference WAV.

    Args:
        text: Text to speak.
        speaker_wav_path: Path to a WAV file (or list of paths) for the reference voice.
        language: Language code (e.g. "en", "es").
        tts: Optional pre-loaded TTS instance; if None, uses lazy-loaded model.

    Returns:
        WAV file bytes (16-bit PCM).
    """
    if not (text or "").strip():
        return b""

    path = Path(speaker_wav_path)
    if not path.is_file():
        raise FileNotFoundError(f"Speaker WAV not found: {speaker_wav_path}")

    model = tts if tts is not None else _get_model()
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


def clone_voice(
    text: str,
    speaker_wav: str | Path,
    output_path: str | Path,
    language: str = "en",
    tts=None,
) -> str:
    """
    Generate speech in the voice of the reference audio and save to a file.
    Same as synthesize_cloned but writes to output_path and returns the path.

    Args:
        text: Text to speak.
        speaker_wav: Path to reference WAV (voice to clone).
        output_path: Path for output WAV file.
        language: Language code (e.g. "en").
        tts: Optional pre-loaded TTS instance; if None, loads model.

    Returns:
        output_path as string.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    model = tts if tts is not None else _get_model()
    model.tts_to_file(
        text=text.strip(),
        speaker_wav=str(speaker_wav),
        file_path=str(output_path),
        language=language,
    )
    return str(output_path)


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


def get_tts():
    """Load XTTS v2 model once (for standalone script or reuse across multiple clone_voice calls)."""
    return _get_model()


if __name__ == "__main__":
    # Standalone: python -m app.services.tts.voice_cloning [ref_wav] [output_wav]
    # From server root. Example refs: audios/OVERLOAD/0308.wav, audios/OPTIMAL/0028.wav
    import sys
    SCRIPT_DIR = Path(__file__).resolve().parent
    default_ref = Path("audios") / "OVERLOAD" / "0308.wav"
    default_out = SCRIPT_DIR / "output_clone.wav"

    ref_wav = Path(sys.argv[1]) if len(sys.argv) > 1 else default_ref
    out_wav = Path(sys.argv[2]) if len(sys.argv) > 2 else default_out
    if not ref_wav.is_file():
        print(f"Reference WAV not found: {ref_wav}")
        print("Usage: python -m app.services.tts.voice_cloning [ref_wav] [output_wav]")
        sys.exit(1)

    tts = get_tts()
    clone_voice(
        text="Hello world! The model is now fully functional and generating audio purely on the CPU.",
        speaker_wav=ref_wav,
        output_path=out_wav,
        language="en",
        tts=tts,
    )
    print("Saved:", out_wav)
