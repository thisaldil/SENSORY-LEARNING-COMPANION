import os
import re
from dotenv import load_dotenv
from scenes import SCENES

load_dotenv()

# If you want optional AI routing, keep Groq enabled.
USE_AI_ROUTER = os.getenv("USE_AI_ROUTER", "false").lower() == "true"
MODEL = os.getenv("MODEL_ID", "llama-3.3-70b-versatile")

SYLLABUS_KEYWORDS = [
    # SPACE
    ("day and night", "day_and_night"),
    ("rotation", "day_and_night"),
    ("solar system", "solar_system_basic"),
    ("planets", "solar_system_basic"),
    ("sun", "solar_system_basic"),
    # PLANTS
    ("photosynthesis", "photosynthesis"),
    ("leaf", "photosynthesis"),
    ("plants", "photosynthesis"),
    # ENVIRONMENT
    ("water cycle", "water_cycle"),
    ("evaporation", "water_cycle"),
    ("condensation", "water_cycle"),
    ("precipitation", "water_cycle"),
    ("rain", "water_cycle"),
    ("cloud", "water_cycle"),
    # MATTER
    ("matter", "states_of_matter"),
    ("solid", "states_of_matter"),
    ("liquid", "states_of_matter"),
    ("gas", "states_of_matter"),
    ("states of matter", "states_of_matter"),
    # PHYSICS
    ("force", "forces_motion"),
    ("motion", "forces_motion"),
    ("push", "forces_motion"),
    ("pull", "forces_motion"),
]


def normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def pick_scene_id(concept: str) -> str:
    t = normalize(concept)
    for kw, scene_id in SYLLABUS_KEYWORDS:
        if kw in t:
            return scene_id
    return "photosynthesis"  # friendly default for Grade 6


def generate_scene(concept: str) -> dict:
    scene_id = pick_scene_id(concept)
    scene = SCENES.get(scene_id)

    # Always return a known-good scene (best visuals).
    # Later you can add AI to tweak labels or add extra arrows,
    # but KEEP the renderer stable.
    return {"concept": concept, "sceneId": scene_id, "scene": scene}
