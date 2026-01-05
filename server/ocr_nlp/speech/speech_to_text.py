from functools import lru_cache
import tempfile
import os

@lru_cache(maxsize=1)
def _get_model():
    try:
        import whisper
    except ImportError as exc:
        raise RuntimeError(
            "Package 'openai-whisper' is not installed. Install it with: pip install openai-whisper"
        ) from exc

    return whisper.load_model("base")

def speech_to_text(audio_bytes):
    """
    Convert audio bytes to text using Whisper
    """

    # Save audio temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        temp_audio.write(audio_bytes)
        temp_path = temp_audio.name

    try:
        model = _get_model()
        result = model.transcribe(temp_path)
        text = result.get("text", "").strip()
        return text
    finally:
        os.remove(temp_path)
