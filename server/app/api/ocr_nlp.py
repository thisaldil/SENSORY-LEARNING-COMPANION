from fastapi import APIRouter, File, UploadFile

from ocr_nlp.pipeline.pipeline_controller import handle_image, handle_text
from ocr_nlp.pipeline.voice_controller import handle_voice

router = APIRouter()


@router.post("/process-text")
def process_text(payload: dict):
    return handle_text(payload.get("text", ""))


@router.post("/process-image")
def process_image(file: UploadFile = File(...)):
    image_bytes = file.file.read()
    return handle_image(image_bytes)


@router.post("/process-voice")
async def process_voice(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    return handle_voice(audio_bytes)
