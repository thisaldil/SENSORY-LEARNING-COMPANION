"""
Script Builder - Final Script Assembly with Timing
"""
from typing import Any, Optional

DEFAULT_SCENE_DURATION = 6000
INTRO_SCENE_DURATION = 5000
SUMMARY_SCENE_DURATION = 8000
MIN_SCENE_DURATION = 4000
MAX_SCENE_DURATION = 10000

ACTOR_COUNT_DURATION_MULTIPLIER = {1: 1.0, 2: 1.1, 3: 1.2, 4: 1.3, 5: 1.4, 6: 1.5, 7: 1.6, 8: 1.7}


def calculate_scene_duration(scene_data: dict) -> int:
    """Calculate duration for a scene in ms."""
    scene_id = (scene_data.get("id") or "").lower()
    num_actors = len(scene_data.get("actors", []))
    text_length = len(scene_data.get("text", ""))
    if "intro" in scene_id:
        base_duration = INTRO_SCENE_DURATION
    elif "summary" in scene_id or "conclusion" in scene_id:
        base_duration = SUMMARY_SCENE_DURATION
    else:
        base_duration = DEFAULT_SCENE_DURATION
    multiplier = ACTOR_COUNT_DURATION_MULTIPLIER.get(num_actors, 1.8)
    duration = int(base_duration * multiplier)
    if text_length > 100:
        duration = int(duration * 1.2)
    if text_length > 150:
        duration = int(duration * 1.3)
    return max(MIN_SCENE_DURATION, min(duration, MAX_SCENE_DURATION))


def build_script(title: str, scenes: list, concept_analysis: Optional[dict] = None) -> dict:
    """Build final animation script JSON from mapped scenes."""
    concept_analysis = concept_analysis or {}
    current_start_time = 0
    script_scenes = []
    for i, scene_data in enumerate(scenes):
        duration = calculate_scene_duration(scene_data)
        scene = {
            "id": scene_data.get("id", f"scene_{i + 1}"),
            "startTime": current_start_time,
            "duration": duration,
            "text": scene_data.get("text") or scene_data.get("message", ""),
            "actors": scene_data.get("actors", []),
        }
        if "environment" in scene_data:
            scene["environment"] = scene_data["environment"]
        script_scenes.append(scene)
        current_start_time += duration
    return {"title": title, "duration": current_start_time, "scenes": script_scenes}


def validate_script_structure(script: dict) -> bool:
    """Validate the final script structure."""
    if not isinstance(script, dict):
        return False
    if not all(f in script for f in ["title", "duration", "scenes"]):
        return False
    if not isinstance(script["scenes"], list) or len(script["scenes"]) == 0:
        return False
    total_time = 0
    for i, scene in enumerate(script["scenes"]):
        if not all(f in scene for f in ["id", "startTime", "duration", "text", "actors"]):
            return False
        if scene["startTime"] != total_time:
            scene["startTime"] = total_time
        total_time = scene["startTime"] + scene["duration"]
        if not isinstance(scene["actors"], list):
            return False
        for actor in scene["actors"]:
            if not isinstance(actor, dict) or "type" not in actor or "x" not in actor or "y" not in actor:
                return False
    if script["duration"] != total_time:
        script["duration"] = total_time
    return True
