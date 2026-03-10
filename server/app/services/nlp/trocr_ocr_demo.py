"""
Local TrOCR OCR service for viva/demo routes.

This module is intentionally separate from Google Vision to avoid any
behavioral impact on existing production endpoints.
"""
from __future__ import annotations

import io
import os
from functools import lru_cache
from typing import Tuple


DEFAULT_TROCR_MODEL_PATH = os.getenv(
    "TROCR_DEMO_MODEL_PATH",
    r"D:\trocr-finetuned-20260307T130255Z-3-001\trocr-finetuned",
)


@lru_cache(maxsize=1)
def _load_trocr_components():
    """Lazy-load TrOCR components from a local checkpoint path."""
    try:
        import torch
        from PIL import Image
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    except Exception as exc:  # pragma: no cover - dependency/runtime dependent
        raise RuntimeError(
            "Missing TrOCR runtime dependencies (torch/transformers/Pillow)."
        ) from exc

    try:
        processor = TrOCRProcessor.from_pretrained(
            DEFAULT_TROCR_MODEL_PATH,
            local_files_only=True,
        )
        model = VisionEncoderDecoderModel.from_pretrained(
            DEFAULT_TROCR_MODEL_PATH,
            local_files_only=True,
        )
    except Exception as exc:  # pragma: no cover - filesystem/runtime dependent
        raise RuntimeError(
            f"Failed loading local TrOCR model at '{DEFAULT_TROCR_MODEL_PATH}'"
        ) from exc

    model.eval()
    return processor, model, torch, Image


def extract_text_from_image_bytes(image_bytes: bytes) -> Tuple[str, str, bool]:
    """
    Extract text using local TrOCR.

    Returns: (text, model_path, used_fallback)
    """
    if not image_bytes:
        raise ValueError("Empty image bytes")

    try:
        processor, model, torch, Image = _load_trocr_components()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        pixel_values = processor(images=image, return_tensors="pt").pixel_values
        with torch.no_grad():
            generated_ids = model.generate(pixel_values, max_new_tokens=256)
        text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
        text = text or "No text detected by local TrOCR model."
        return text, DEFAULT_TROCR_MODEL_PATH, False
    except Exception:
        # Keep demo endpoint resilient even if local model is unavailable at runtime.
        fallback_text = (
            "Demo OCR fallback output: local TrOCR checkpoint unavailable at runtime. "
            "This endpoint is configured to use your fine-tuned TrOCR model path."
        )
        return fallback_text, DEFAULT_TROCR_MODEL_PATH, True
