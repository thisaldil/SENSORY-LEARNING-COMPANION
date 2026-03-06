"""
Visual Enricher - Adds Educational Visual Aids to Scenes
"""
from typing import Any, Dict, List


def enrich_scene(scene_data: dict, concept_analysis: dict = None) -> dict:
    """
    Enrich a scene with educational visual aids. Returns enriched scene (copy).
    """
    concept_analysis = concept_analysis or {}
    scene_id = (scene_data.get("id") or "").lower()
    scene_text = (scene_data.get("text") or "").lower()
    actors = list(scene_data.get("actors") or [])
    domain = (concept_analysis.get("domain") or "generic").lower()
    topic = (concept_analysis.get("topic") or "").lower()

    # Photosynthesis
    if "photosynthesis" in topic or (domain == "biology" and any(kw in scene_text for kw in ["water", "carbon", "glucose", "oxygen", "sunlight"])):
        actors = _enrich_photosynthesis(scene_id, scene_text, actors, domain)

    # Rock cycle
    elif "rock" in topic or "rock" in scene_text or domain == "earth_science":
        actors = _enrich_rock_cycle(scene_id, scene_text, actors, domain)

    # Water cycle
    elif "water" in topic and "cycle" in topic:
        actors = _enrich_water_cycle(scene_id, scene_text, actors, domain)

    # Physics
    elif domain == "physics" or "gravity" in scene_text:
        actors = _enrich_physics(scene_id, scene_text, actors, domain)

    # General
    actors = _add_general_visual_aids(scene_id, scene_text, actors, domain)

    out = scene_data.copy()
    out["actors"] = actors
    return out


def _enrich_photosynthesis(scene_id: str, scene_text: str, actors: list, domain: str) -> list:
    """Enrich photosynthesis scenes with roots, leaves, arrows, labels."""
    enriched = list(actors)
    has_plant = any(a.get("type") == "plant" for a in actors)
    has_root = any(a.get("type") == "root" for a in actors)
    has_leaf = any(a.get("type") == "leaf" for a in actors)

    if "water" in scene_text or "absorption" in scene_text:
        if has_plant and not has_root:
            enriched.insert(0, {"type": "root", "x": 400, "y": 550, "depth": 80, "width": 100, "branches": 6, "color": "#8B4513", "animation": "absorb"})
        if not any(a.get("type") == "arrow" for a in enriched):
            enriched.append({"type": "arrow", "x": 400, "y": 520, "length": 120, "angle": -1.5708, "color": "#2196F3", "thickness": 2, "animation": "appear"})
        if not any(a.get("type") == "label" and (a.get("text") or "").strip() == "H₂O" for a in enriched):
            enriched.append({"type": "label", "x": 420, "y": 460, "text": "H₂O", "fontSize": 16, "color": "#2196F3", "animation": "appear"})

    if "carbon" in scene_text or "co2" in scene_text:
        if not any(a.get("type") == "label" and "CO₂" in str(a.get("text", "")) for a in enriched):
            enriched.append({"type": "label", "x": 520, "y": 250, "text": "CO₂", "fontSize": 16, "color": "#757575", "animation": "appear"})
        if has_plant and not has_leaf:
            enriched.append({"type": "leaf", "x": 400, "y": 200, "size": 35, "angle": 0, "color": "#4CAF50", "animation": "sway"})

    if "sun" in scene_text or "light" in scene_text:
        if has_plant and not has_leaf:
            enriched.append({"type": "leaf", "x": 400, "y": 200, "size": 35, "angle": 0, "color": "#4CAF50", "animation": "sway"})
        if not any(a.get("type") == "arrow" for a in enriched):
            enriched.append({"type": "arrow", "x": 700, "y": 80, "length": 200, "angle": 0.785, "color": "#FFD700", "thickness": 3, "animation": "appear"})

    if "glucose" in scene_text or "sugar" in scene_text:
        if not any(a.get("type") == "glucose" for a in enriched):
            enriched.append({"type": "glucose", "x": 520, "y": 300, "size": 40, "color": "#FF9800", "animation": "appear"})
        if not any("C₆H₁₂O₆" in str(a.get("text", "")) for a in enriched if a.get("type") == "label"):
            enriched.append({"type": "label", "x": 520, "y": 350, "text": "C₆H₁₂O₆", "fontSize": 14, "color": "#FF9800", "animation": "appear"})

    if "oxygen" in scene_text or "o2" in scene_text:
        if not any("O₂" in str(a.get("text", "")) for a in enriched if a.get("type") == "label"):
            enriched.append({"type": "label", "x": 400, "y": 150, "text": "O₂", "fontSize": 16, "color": "#4CAF50", "animation": "appear"})

    return enriched


def _enrich_rock_cycle(scene_id: str, scene_text: str, actors: list, domain: str) -> list:
    """Enrich rock cycle scenes."""
    enriched = list(actors)
    if not any(a.get("type") == "mountain" for a in enriched):
        enriched.insert(0, {"type": "mountain", "x": 400, "y": 250, "size": 120, "color": "#795548", "animation": "idle"})
    if ("igneous" in scene_text or "magma" in scene_text) and not any(a.get("type") == "volcano" for a in enriched):
        enriched.append({"type": "volcano", "x": 600, "y": 350, "size": 80, "color": "#FF5722", "animation": "pulse"})
    return enriched


def _enrich_water_cycle(scene_id: str, scene_text: str, actors: list, domain: str) -> list:
    """Enrich water cycle scenes."""
    return list(actors)


def _enrich_physics(scene_id: str, scene_text: str, actors: list, domain: str) -> list:
    """Enrich physics scenes."""
    return list(actors)


def _add_general_visual_aids(scene_id: str, scene_text: str, actors: list, domain: str) -> list:
    """Add general arrows/labels from keywords."""
    return list(actors)
