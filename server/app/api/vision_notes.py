from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from google.cloud import vision

from app.core.vision_client import get_vision_client, get_vision_client_error


router = APIRouter(prefix="/vision/notes", tags=["Vision Notes"])


class VisionNoteResponse(BaseModel):
    text: str


@router.post("/analyze", response_model=VisionNoteResponse)
async def analyze_note_image(file: UploadFile = File(...)) -> VisionNoteResponse:
    """
    Analyze a handwritten/printed note image and return extracted text using
    Google Cloud Vision document_text_detection.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        client = get_vision_client()
        if client is None:
            detail = (
                "Google Vision credentials are not configured on this server. "
                "Set VISION_GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON) "
                "or configure Google ADC."
            )
            err = get_vision_client_error()
            if err:
                detail = f"{detail} ({err})"
            raise HTTPException(status_code=503, detail=detail)

        content = await file.read()
        image = vision.Image(content=content)
        response = client.document_text_detection(image=image)

        if response.error.message:
            raise HTTPException(
                status_code=500,
                detail=f"Vision API error: {response.error.message}",
            )

        full_text = response.full_text_annotation.text or ""
        return VisionNoteResponse(text=full_text.strip())

    except HTTPException:
        # Re-raise HTTP exceptions so FastAPI preserves status code and message
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

