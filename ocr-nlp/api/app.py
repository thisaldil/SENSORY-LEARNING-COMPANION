from fastapi import APIRouter
from pipeline.pipeline_controller import handle_text, handle_image

router = APIRouter()

@router.post("/process-text")
def process_text(payload: dict):
    return handle_text(payload.get("text", ""))

@router.post("/process-image")
def process_image():
    return handle_image()
