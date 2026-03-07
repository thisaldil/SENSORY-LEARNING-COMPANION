"""
Multimodal Sync Orchestrator (Member 3)

Entry point for POST /api/sensory/overlay.
"""
from __future__ import annotations

from typing import Any, Dict

from beanie import PydanticObjectId

from app.models.sensory_models import SensorySession
from app.services.sensory.audio_engine import generate_audio_overlay
from app.services.sensory.haptic_generator import build_haptic_timeline


def _safe_object_id(value: str | None) -> PydanticObjectId | None:
    if not value:
        return None
    try:
        return PydanticObjectId(value)
    except Exception:
        return None


def _normalize_state(cognitive_state: str) -> str:
    state = (cognitive_state or "").upper().strip()
    if state in {"OVERLOAD", "HIGH_LOAD"}:
        return "OVERLOAD"
    if state in {"LOW_LOAD", "UNDERLOAD"}:
        return "LOW_LOAD"
    return "OPTIMAL"


def _compute_research_metrics(
    script: Dict[str, Any],
    haptics: list[dict],
    audio: dict,
) -> Dict[str, Any]:
    duration = int(script.get("duration", 0) or 0)
    total_seconds = max(1.0, duration / 1000.0)

    haptic_count = len(haptics)
    narration_items = audio.get("narration") or []
    total_narration_ms = sum(int(item.get("duration", 0) or 0) for item in narration_items)
    total_chars = sum(len(str(item.get("text", "") or "")) for item in narration_items)

    return {
        "animation_duration_ms": duration,
        "haptic_event_count": haptic_count,
        "haptic_events_per_second": haptic_count / total_seconds,
        "narration_item_count": len(narration_items),
        "narration_total_ms": total_narration_ms,
        "narration_coverage_ratio": (total_narration_ms / duration) if duration > 0 else 0.0,
        "narration_total_chars": total_chars,
        "narration_chars_per_second": total_chars / total_seconds,
    }


async def generate_and_log_sensory_overlay(
    script: Dict[str, Any],
    cognitive_state: str,
    *,
    concept: str | None = None,
    lesson_id: str | None = None,
    student_id: str | None = None,
    session_id: str | None = None,
) -> Dict[str, Any]:
    """
    Public orchestrator used by the FastAPI endpoint.
    """
    state = _normalize_state(cognitive_state)

    haptics = build_haptic_timeline(script, state)
    audio = generate_audio_overlay(script, state)

    metrics = _compute_research_metrics(script, haptics, audio)

    overlay = {
        "cognitive_state": state,
        "ambient_mode": audio["ambient_mode"],
        "speech_rate": audio["speech_rate"],
        "haptics": haptics,
        "narration": audio["narration"],
        "research_metrics": metrics,
    }

    # Persist research record
    lesson_obj_id = _safe_object_id(lesson_id)
    student_obj_id = _safe_object_id(student_id)

    doc = SensorySession(
        student_id=student_obj_id,
        lesson_id=lesson_obj_id,
        session_id=session_id,
        concept=concept,
        cognitive_state=state,
        animation_script=script,
        haptic_timeline=haptics,
        audio_timeline=audio["narration"],
        ambient_mode=audio["ambient_mode"],
        speech_rate=audio["speech_rate"],
        research_metrics=metrics,
    )
    await doc.insert()

    return overlay


