"""
Haptic Generator (Member 3)

Pure deterministic mapping from Member 2's AnimationScript JSON
to a flat haptic_timeline.
"""
from __future__ import annotations

from typing import Any, Dict, List


def _normalize_state(cognitive_state: str) -> str:
    state = (cognitive_state or "").upper().strip()
    if state in {"OVERLOAD", "HIGH_LOAD"}:
        return "OVERLOAD"
    if state in {"LOW_LOAD", "UNDERLOAD"}:
        return "LOW_LOAD"
    return "OPTIMAL"


def _base_pattern_for_state(state: str) -> str:
    if state == "OVERLOAD":
        return "tap_soft"
    if state == "LOW_LOAD":
        return "buzz_pulse"
    return "tap_medium"


def _intensity_for_state(state: str) -> float:
    if state == "OVERLOAD":
        return 0.35
    if state == "LOW_LOAD":
        return 0.85
    return 0.6


def build_haptic_timeline(
    script: Dict[str, Any],
    cognitive_state: str,
) -> List[Dict[str, Any]]:
    """
    Deterministically walk AnimationScript.scenes and emit haptic cues.

    Rules (aligned with CTML framing):
    - OVERLOAD: 1 soft cue at each scene onset only (low salience).
    - OPTIMAL: 2 cues (onset + mid‑scene) at medium intensity.
    - LOW_LOAD: 3 cues (onset, mid, end‑1s) with higher intensity.
    """
    state = _normalize_state(cognitive_state)
    scenes = script.get("scenes") or []
    if not isinstance(scenes, list):
        return []

    timeline: List[Dict[str, Any]] = []
    pattern = _base_pattern_for_state(state)
    intensity = _intensity_for_state(state)

    for scene in scenes:
        try:
            start = int(scene.get("startTime", 0))
            duration = int(scene.get("duration", 0))
        except Exception:
            continue
        if duration <= 0:
            continue

        scene_id = scene.get("id") or None
        end = start + duration
        mid = start + duration // 2
        almost_end = max(start, end - 1000)

        # Scene onset cue (always present)
        timeline.append(
            {
                "at": max(0, start + 100),
                "pattern": pattern,
                "scene_id": scene_id,
                "channel": "device",
                "intensity": intensity,
            }
        )

        if state in {"OPTIMAL", "LOW_LOAD"}:
            # Mid‑scene cue to support segmenting & temporal contiguity
            timeline.append(
                {
                    "at": mid,
                    "pattern": pattern,
                    "scene_id": scene_id,
                    "channel": "device",
                    "intensity": intensity,
                }
            )

        if state == "LOW_LOAD":
            # Extra cue near the end to re‑engage attention
            timeline.append(
                {
                    "at": almost_end,
                    "pattern": "buzz_short",
                    "scene_id": scene_id,
                    "channel": "device",
                    "intensity": min(1.0, intensity + 0.1),
                }
            )

    # Ensure timeline is globally sorted by time
    timeline.sort(key=lambda ev: ev.get("at", 0))
    return timeline


