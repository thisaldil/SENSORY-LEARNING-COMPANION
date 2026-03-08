"""
Audio Engine (Member 3)

Uses Gemini (via existing visual ai_generator client) to generate
TTS‑ready narration aligned with an AnimationScript, and selects
ambient sound mode + speech rate based on cognitive state.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List

from app.services.visual.ai_generator import _generate_text, clean_json_output


def _normalize_state(cognitive_state: str) -> str:
    state = (cognitive_state or "").upper().strip()
    if state in {"OVERLOAD", "HIGH_LOAD"}:
        return "OVERLOAD"
    if state in {"LOW_LOAD", "UNDERLOAD"}:
        return "LOW_LOAD"
    return "OPTIMAL"


def _ambient_mode_for_state(state: str) -> str:
    """
    Map cognitive state to ambient sound strategy.

    - OVERLOAD: silence (minimize extraneous load).
    - OPTIMAL: 40Hz gamma‑like subtle background for focus.
    - LOW_LOAD: spatial_music to gently re‑engage.
    """
    if state == "OVERLOAD":
        return "silence"
    if state == "LOW_LOAD":
        return "spatial_music"
    return "40hz_gamma"


def _speech_rate_for_state(state: str) -> str:
    if state == "OVERLOAD":
        return "slow"
    if state == "LOW_LOAD":
        return "fast"
    return "normal"


def _build_narration_prompt(script: Dict[str, Any], state: str) -> str:
    scenes = script.get("scenes") or []
    scene_summaries = []
    for s in scenes:
        scene_summaries.append(
            {
                "id": s.get("id"),
                "startTime": s.get("startTime"),
                "duration": s.get("duration"),
                "text": s.get("text"),
            }
        )

    state_block = {
        "OVERLOAD": "Learner is overloaded. Narration must be slower, simpler, with longer pauses.",
        "OPTIMAL": "Learner is in an optimal zone. Narration can be natural, moderately paced.",
        "LOW_LOAD": "Learner is underloaded / bored. Narration can be slightly faster and more energetic.",
    }[state]

    payload = json.dumps(scene_summaries, indent=2)
    return f"""
You are a TTS narration designer for a neuro-adaptive educational app.

{state_block}

Given the list of scenes below (with startTime, duration, and on-screen text),
create a JSON narration timeline suitable for a TTS engine.

Rules:
- Return ONLY valid JSON, no markdown.
- Use milliseconds for all timing.
- Align narration to scene boundaries (speak while the scene is visible).
- For each scene, produce 1–2 short spoken sentences that sound natural when read aloud.
- Do NOT introduce new science content; rephrase the text already on screen.

JSON format:
{{
  "narration": [
    {{
      "at": 0,
      "duration": 4000,
      "text": "Spoken sentence here."
    }}
  ]
}}

Scenes:
{payload}
"""


def generate_audio_overlay(
    script: Dict[str, Any],
    cognitive_state: str,
) -> Dict[str, Any]:
    """
    Generate narration timeline + ambient sound config.

    Falls back to a deterministic rule-based narration if Gemini
    is unavailable or returns invalid JSON.
    """
    state = _normalize_state(cognitive_state)
    ambient_mode = _ambient_mode_for_state(state)
    speech_rate = _speech_rate_for_state(state)

    prompt = _build_narration_prompt(script, state)
    narration: List[Dict[str, Any]] = []
    llm_error: str | None = None

    try:
        raw = _generate_text(prompt, temperature=0.3, max_tokens=2048)
        cleaned = clean_json_output(raw)
        data = json.loads(cleaned)
        items = data.get("narration") or []
        if isinstance(items, list):
            for item in items:
                try:
                    at = int(item.get("at", 0))
                    duration = int(item.get("duration", 0))
                    text = str(item.get("text", "")).strip()
                except Exception:
                    continue
                if not text or duration <= 0:
                    continue
                narration.append({"at": at, "duration": duration, "text": text})
    except Exception as e:  # pragma: no cover - external API variability
        llm_error = str(e)

    if not narration:
        # Fallback: deterministic narration from scene text
        scenes = script.get("scenes") or []
        for scene in scenes:
            try:
                start = int(scene.get("startTime", 0))
                duration = int(scene.get("duration", 0))
            except Exception:
                continue
            if duration <= 0:
                continue
            text = str(scene.get("text", "")).strip()
            if not text:
                continue
            narration.append(
                {
                    "at": start + 200,
                    "duration": max(1500, duration - 400),
                    "text": text,
                }
            )

    narration.sort(key=lambda item: item.get("at", 0))

    return {
        "ambient_mode": ambient_mode,
        "speech_rate": speech_rate,
        "narration": narration,
        "cognitive_state": state,
        "llm_error": llm_error,
    }


