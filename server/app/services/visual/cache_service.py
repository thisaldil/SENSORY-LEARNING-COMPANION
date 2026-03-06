"""
Cache service for animation scripts – get/save in MongoDB (Visual Learning Platform).
"""
from typing import Any, Dict, Optional

from app.models.visual.animation import AnimationModel

# Initialize model
animation_model = AnimationModel()


async def get_cached_script(concept: str) -> Optional[Dict[str, Any]]:
    """Get cached animation script from MongoDB. Returns { script, source } or None."""
    try:
        result = await animation_model.find_one(concept)
        if result:
            if is_script_complete(result.get("script")):
                return {
                    "script": result["script"],
                    "source": result.get("source", "cached"),
                }
            await animation_model.delete_one(concept)
        return None
    except Exception as e:
        print(f"Error getting cached script: {e}")
        return None


async def save_script(concept: str, script: dict, source: str) -> None:
    """Save animation script to MongoDB."""
    try:
        await animation_model.create(concept, script, source)
    except Exception as e:
        print(f"Error saving script: {e}")


def is_script_complete(script: dict) -> bool:
    """Validate script structure is complete."""
    if not isinstance(script, dict):
        return False
    if not all(field in script for field in ["title", "duration", "scenes"]):
        return False
    if not isinstance(script["scenes"], list) or len(script["scenes"]) == 0:
        return False
    for scene in script["scenes"]:
        if not all(field in scene for field in ["id", "startTime", "duration", "text", "actors"]):
            return False
        if not isinstance(scene["actors"], list):
            return False
        for actor in scene["actors"]:
            if not all(field in actor for field in ["type", "x", "y", "animation"]):
                return False
    return True


def is_script_valid(script: dict) -> bool:
    """Basic validation of animation script structure (for API response)."""
    return is_script_complete(script)
