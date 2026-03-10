from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.nlp.trocr_ocr_demo import extract_text_from_image_bytes


router = APIRouter(prefix="/demo/vision/notes", tags=["Vision Notes Demo"])


class VisionNoteLocalDemoResponse(BaseModel):
    text: str
    provider: str
    model_path: str
    used_fallback: bool


@router.post("/analyze", response_model=VisionNoteLocalDemoResponse)
async def analyze_note_image_local_demo(
    file: UploadFile = File(...),
) -> VisionNoteLocalDemoResponse:
    """
    Demo OCR endpoint that uses a local fine-tuned TrOCR checkpoint.

    This route is isolated from the Google Vision route for viva demonstration.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    content = await file.read()
    try:
        text, model_path, used_fallback = extract_text_from_image_bytes(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Local TrOCR demo error: {exc}") from exc

    return VisionNoteLocalDemoResponse(
        text=text,
        provider="local-trocr-finetuned-demo",
        model_path=model_path,
        used_fallback=used_fallback,
    )

