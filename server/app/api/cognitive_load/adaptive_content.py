"""
Adaptive Content API – (deprecated) Content Mapping Logic

The original `/api/v1/content/next` endpoint has been retired in favor of
the Member 1 + Member 2 neuro-adaptive pipeline:
- /api/v1/transmute
- /api/content/transmuted/latest
- /api/animation/neuro-adaptive
- /api/animation/neuro-adaptive/latest

This module is kept as a placeholder to avoid import errors, but exposes
no public routes.
"""
from fastapi import APIRouter


router = APIRouter()
