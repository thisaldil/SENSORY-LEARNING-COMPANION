from fastapi import APIRouter
from pipeline.pipeline_controller import handle_text, handle_image
from fastapi import UploadFile, File
 

router = APIRouter()

@router.post("/process-text")
def process_text(payload: dict):
    return handle_text(payload.get("text", ""))

@router.post("/process-image")
def process_image(file: UploadFile = File(...)):
    image_bytes = file.file.read()
    return handle_image(image_bytes)