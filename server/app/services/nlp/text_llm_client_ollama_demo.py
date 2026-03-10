"""
Text LLM Client - Ollama wrapper for the demo Adaptive Text Engine.

This module is isolated for viva/demo use and does not affect the
Gemini-based production transmutation path.
"""
from __future__ import annotations

import os

import httpx
from dotenv import load_dotenv

from app.config import settings

load_dotenv()


def _get_ollama_base_url() -> str:
    return (
        os.getenv("OLLAMA_BASE_URL")
        or getattr(settings, "OLLAMA_BASE_URL", None)
        or "http://localhost:11434"
    ).rstrip("/")


def _get_model_name() -> str:
    return (
        os.getenv("OLLAMA_MODEL")
        or getattr(settings, "OLLAMA_MODEL", None)
        or "llama3.1"
    )


def generate_text(prompt: str, temperature: float = 0.3, max_tokens: int = 2048) -> str:
    """Call local Ollama and return generated plain text."""
    payload = {
        "model": _get_model_name(),
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
        },
    }

    url = f"{_get_ollama_base_url()}/api/generate"
    try:
        response = httpx.post(url, json=payload, timeout=120.0)
        response.raise_for_status()
    except Exception as exc:  # pragma: no cover - runtime/network dependent
        raise RuntimeError(f"Ollama request failed: {exc}") from exc

    data = response.json()
    text = (data.get("response") or "").strip()
    if not text:
        raise RuntimeError("Ollama returned empty response")
    return text
