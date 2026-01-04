import whisper
import tempfile
import os

# Load once
model = whisper.load_model("base")

def speech_to_text(audio_bytes):
    """
    Convert audio bytes to text using Whisper
    """

    # Save audio temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        temp_audio.write(audio_bytes)
        temp_path = temp_audio.name

    try:
        result = model.transcribe(temp_path)
        text = result.get("text", "").strip()
        return text
    finally:
        os.remove(temp_path)
