"""
Text LLM Client – Gemini wrapper for the Adaptive Text Engine.

This is intentionally separate from the visual animation generator so that the
adaptive text pipeline does not depend on any visual-specific logic.
"""
from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from google import genai

from app.config import settings

load_dotenv()

_client: Any | None = None


def _get_api_key() -> str:
    """Read Gemini API key from config or env (supports GEMINI_API_KEY and Gemini_API_Key)."""
    key = (
        getattr(settings, "GEMINI_API_KEY", None)
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("Gemini_API_Key")
        or ""
    )
    return key.strip()


def _get_model_name() -> str:
    """Model name for text transmutation; defaults to your Gemini 3.1 preview model."""
    return getattr(settings, "GEMINI_MODEL", None) or os.getenv(
        "GEMINI_MODEL", "models/gemini-3.1-flash-lite-preview"
    )


def get_client():
    """Get or create Gemini Client. Returns the client instance."""
    global _client
    if _client is not None:
        return _client
    api_key = _get_api_key()
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY (or Gemini_API_Key) is not set. Please set it in your .env file."
        )
    _client = genai.Client(api_key=api_key)
    return _client


def generate_text(prompt: str, temperature: float = 0.3, max_tokens: int = 2048) -> str:
    """Call Gemini via google-genai and return response text (plain text only)."""
    client = get_client()
    response = client.models.generate_content(
        model=_get_model_name(),
        contents=prompt,
        config={"temperature": temperature, "max_output_tokens": max_tokens},
    )
    if not response or not getattr(response, "text", None):
        raise RuntimeError("Gemini returned empty response")
    return response.text.strip()

