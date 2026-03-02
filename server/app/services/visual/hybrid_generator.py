"""
Hybrid Generator - Orchestrator for Hybrid Generation Pipeline
"""
import asyncio
from typing import Any, Optional

from app.services.visual.ai_generator import analyze_concept, plan_scenes_hybrid
from app.services.visual.actor_mapper import map_actor, validate_actor_type
from app.services.visual.animation_mapper import map_animation, validate_animation
from app.services.visual.layout_engine import place_actor, get_actor_properties
from app.services.visual.script_builder import build_script, validate_script_structure
from app.services.visual.visual_enricher import enrich_scene


def _infer_environment(domain: str, scene_text: str) -> str:
    """Infer environment hint for a scene."""
    text_lower = (scene_text or "").lower()
    if domain == "astronomy" or any(k in text_lower for k in ["space", "orbit", "planet", "star", "galaxy"]):
        return "space"
    if domain == "earth_science" or any(k in text_lower for k in ["ground", "earth", "mountain", "ocean", "volcano"]):
        return "earth"
    return "default"


def generate_hybrid_script(concept: str) -> Optional[dict]:
    """
    Generate animation script using the Hybrid Generation Pipeline (sync).
    Returns script dict or None.
    """
    try:
        concept_analysis = analyze_concept(concept)
        if not concept_analysis or not concept_analysis.get("keyIdeas"):
            return None
        topic = concept_analysis.get("topic", concept)
        domain = concept_analysis.get("domain", "generic")

        scene_blueprints = plan_scenes_hybrid(concept_analysis)
        if not scene_blueprints:
            return None

        mapped_scenes = []
        for scene_idx, blueprint in enumerate(scene_blueprints):
            scene_id = blueprint.get("scene", f"scene_{scene_idx + 1}")
            message = blueprint.get("message", "")
            conceptual_actors = blueprint.get("actors", [])
            conceptual_actions = blueprint.get("actions", [])

            mapped_actors = []
            for actor_idx, (conceptual_actor, conceptual_action) in enumerate(zip(conceptual_actors, conceptual_actions)):
                actor_config = map_actor(conceptual_actor)
                if not actor_config:
                    continue
                actor_type = actor_config["type"]
                if not validate_actor_type(actor_type):
                    continue
                animation = map_animation(conceptual_action)
                if not validate_animation(animation):
                    animation = "idle"

                layout_context = {
                    "domain": domain,
                    "moleculeType": actor_config.get("moleculeType"),
                    "cellType": actor_config.get("cellType"),
                    "text": conceptual_actor.capitalize() if actor_type == "label" else None,
                }
                actor_props = get_actor_properties(actor_type, layout_context)
                placement = place_actor(actor_type, actor_idx, len(conceptual_actors), {"domain": domain})

                actor = {
                    "type": actor_type,
                    "x": placement["x"],
                    "y": placement["y"],
                    "animation": animation,
                    "color": actor_props.get("color", placement.get("color", "#9E9E9E")),
                }
                if actor_type == "molecule" and actor_config.get("moleculeType"):
                    actor["moleculeType"] = actor_config["moleculeType"]
                    actor["size"] = actor_props.get("size", 25)
                elif actor_type == "leaf":
                    actor["size"] = actor_props.get("size", 35)
                    actor["angle"] = actor_props.get("angle", 0)
                elif actor_type == "root":
                    actor["depth"] = actor_props.get("depth", 80)
                    actor["width"] = actor_props.get("width", 100)
                    actor["branches"] = actor_props.get("branches", 6)
                elif actor_type == "cell":
                    actor["cellType"] = layout_context.get("cellType", "plant")
                    actor["size"] = actor_props.get("size", 40)
                    actor["showLabels"] = True
                elif actor_type == "sun":
                    actor["size"] = actor_props.get("size", 50)
                    actor["rays"] = True
                elif actor_type == "arrow":
                    actor["length"] = actor_props.get("length", 100)
                    actor["angle"] = actor_props.get("angle", 0)
                    actor["thickness"] = 2
                elif actor_type == "label":
                    actor["text"] = layout_context.get("text", conceptual_actor.capitalize())
                    actor["fontSize"] = actor_props.get("fontSize", 16)
                elif actor_type == "number":
                    actor["text"] = layout_context.get("text", "")
                    actor["fontSize"] = actor_props.get("fontSize", 16)
                else:
                    actor["size"] = actor_props.get("size", 40)
                mapped_actors.append(actor)

            mapped_scene = {
                "id": scene_id,
                "text": message,
                "actors": mapped_actors,
                "environment": _infer_environment(domain, message),
            }
            mapped_scenes.append(mapped_scene)

        if not mapped_scenes:
            return None

        enriched_scenes = [enrich_scene(s, concept_analysis) for s in mapped_scenes]
        script = build_script(topic, enriched_scenes, concept_analysis)
        if not validate_script_structure(script):
            return None
        return script
    except Exception as e:
        print(f"Error in hybrid generation: {e}")
        import traceback
        traceback.print_exc()
        return None


async def generate_hybrid_script_async(concept: str) -> Optional[dict]:
    """Async wrapper: run sync generate_hybrid_script in thread."""
    return await asyncio.to_thread(generate_hybrid_script, concept)
