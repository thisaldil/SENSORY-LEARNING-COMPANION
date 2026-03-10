import json
import os
from typing import Any, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.config import settings
from app.services.visual.prebuilt import test_water_cycle_script
from app.services.visual.layout_engine import get_actor_properties

load_dotenv()

_client: Optional[genai.Client] = None


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
    return getattr(settings, "GEMINI_MODEL", None) or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


def get_client() -> genai.Client:
    
    global _client
    if _client is not None:
        return _client
    api_key = _get_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY (or Gemini_API_Key) is not set. Please set it in your .env file.")
    _client = genai.Client(api_key=api_key)
    return _client


def _generate_text(prompt: str, temperature: float = 0.3, max_tokens: int = 2048) -> str:
    """Call Gemini and return response text."""
    client = get_client()
    config = types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    response = client.models.generate_content(
        model=_get_model_name(),
        contents=prompt,
        config=config,
    )
    if not response or not response.text:
        raise RuntimeError("Gemini returned empty response")
    return response.text.strip()


VALID_ACTOR_TYPES = {
    "planet", "earth", "moon", "star", "sun", "asteroid", "comet",
    "cloud", "mountain", "ocean", "volcano",
    "animal", "cell", "bacteria", "leaf", "root", "plant",
    "molecule", "atom", "electron", "proton", "neutron",
    "arrow", "label", "line", "graph", "number", "glucose",
}

VALID_ANIMATIONS = {
    "appear", "idle", "moveUp", "moveDown", "floatIn", "floatOut",
    "glow", "shine", "bubbleUp", "rotate", "pulse", "wave",
    "sway", "grow", "absorb", "orbit", "spin", "vibrate", "fall",
}

KEYWORD_VISUAL_MAP = [
    (["gravity", "gravitational"], "earth", "idle"),
    (["fall", "falling", "drop", "downward", "down"], "arrow", "moveDown"),
    (["pull", "attract", "attraction", "pulls", "pulling"], "arrow", "moveDown"),
    (["orbit", "orbiting", "around"], "moon", "rotate"),
    (["force"], "number", "pulse"),
    (["mass", "heavier", "lighter"], "number", "pulse"),
    (["earth"], "earth", "idle"),
    (["planet"], "planet", "idle"),
    (["moon"], "moon", "idle"),
    (["star", "sun"], "star", "shine"),
    (["space", "universe", "galaxy"], "star", "shine"),
    (["cell", "cells"], "cell", "pulse"),
    (["bacteria", "bacterium"], "bacteria", "pulse"),
    (["leaf", "leaves"], "leaf", "idle"),
    (["root", "roots"], "root", "idle"),
    (["plant", "plants"], "plant", "grow"),
    (["sunlight", "light"], "sun", "shine"),
    (["photosynthesis", "chloroplast", "chlorophyll"], "cell", "pulse"),
    (["glucose", "sugar"], "glucose", "appear"),
    (["oxygen", "o2"], "label", "appear"),
    (["carbon dioxide", "co2", "dioxide"], "label", "appear"),
    (["animal", "animals"], "animal", "idle"),
    (["atom", "atoms"], "atom", "pulse"),
    (["molecule", "molecules"], "molecule", "pulse"),
    (["electron", "electrons"], "electron", "rotate"),
    (["proton", "protons"], "proton", "rotate"),
    (["neutron", "neutrons"], "neutron", "rotate"),
    (["increase", "decrease", "rise", "falling", "grows", "shrinks"], "graph", "appear"),
    (["direction", "toward", "away"], "arrow", "moveDown"),
    (["number", "amount", "how many"], "number", "pulse"),
    (["label", "name", "term", "definition"], "label", "appear"),
    (["line", "connect", "link"], "line", "appear"),
    (["explain", "explanation", "because"], "label", "appear"),
]


def build_comprehensive_prompt(concept: str) -> str:
    """Few-shot prompt using the prebuilt water cycle script as an exemplar."""
    return f"""
You are an expert educational animation designer. Create high-quality, scientifically accurate scripts.

Here is an excellent example of exactly the quality and style I want:

```json
{json.dumps(test_water_cycle_script, indent=2)}
```

Now create a script of exactly the same quality and style for this concept: "{concept}"

Rules:
- 6–8 scenes, total around 45 seconds
- Rich visuals: oceans, sun, clouds, molecules (water, CO2, O2 when relevant), arrows, labels, mountains, plants when relevant
- Educational but simple text (student-friendly)
- Great animations: wave, bubbleUp, fall, vibrate, grow, sway, shine, absorb, moveDown, pulse, rotate
- Multiple molecules for phase changes
- Arrows + labels like "Water Vapor", "Rain", "Groundwater", "H₂O" when appropriate
- Use the exact same JSON structure as the example

Return ONLY valid JSON, no markdown or explanation.
"""



def build_prompt(concept: str) -> str:
    """Legacy: build prompt for AI to generate JSON animation script."""
    return build_comprehensive_prompt(concept)


def clean_json_output(text: str) -> str:
    """Remove markdown, code blocks, and extract JSON."""
    if not text:
        return ""
    text = text.replace("```json", "").replace("```", "")
    for pattern in ["Here is the JSON:", "Here's the animation script:", "Animation script:", "JSON:"]:
        text = text.replace(pattern, "")
    start, end = text.find("{"), text.rfind("}") + 1
    if start != -1 and end > start:
        return text[start:end].strip()
    return text.strip()


def analyze_concept(concept: str) -> dict:
    """Stage 1: Concept analysis – topic, level, domain, keyIdeas (4–7)."""
    prompt = f"""
You are an educational concept analyst. Analyze the learning concept and return 4–7 short, clear ideas.
Return ONLY valid JSON:
{{
  "topic": "short topic name",
  "level": "elementary" | "middle" | "high" | "university",
  "domain": "physics" | "biology" | "chemistry" | "astronomy" | "earth_science" | "math" | "generic",
  "keyIdeas": ["short sentence", "another sentence", ...]
}}
Concept: "{concept}"
"""
    try:
        raw = _generate_text(prompt, temperature=0.2, max_tokens=800)
        cleaned = clean_json_output(raw)
        analysis = json.loads(cleaned)
        topic = analysis.get("topic") or concept.strip()
        level = analysis.get("level") or "middle"
        domain = analysis.get("domain") or "generic"
        key_ideas = analysis.get("keyIdeas") or [concept.strip()]
        if not isinstance(key_ideas, list):
            key_ideas = [str(key_ideas)]
        key_ideas = [str(i).strip() for i in key_ideas if str(i).strip()]
        if len(key_ideas) < 4:
            while len(key_ideas) < 4:
                key_ideas.append(key_ideas[-1] if key_ideas else concept.strip())
        key_ideas = key_ideas[:7]
        return {"topic": topic, "level": level, "domain": domain, "keyIdeas": key_ideas}
    except Exception as e:
        print(f"Error in analyze_concept: {e}")
        return {"topic": concept.strip(), "level": "middle", "domain": "generic", "keyIdeas": [concept.strip()]}


def plan_scenes_hybrid(concept_analysis: dict) -> list:
    """Stage 2 (Hybrid): AI scene planning – returns list of { scene, message, actors, actions }."""
    topic = concept_analysis.get("topic", "")
    domain = concept_analysis.get("domain", "generic")
    key_ideas = concept_analysis.get("keyIdeas", [])
    prompt = f"""
You are an educational animation story planner. Plan scenes for: "{topic}"
Return ONLY valid JSON:
{{
  "scenes": [
    {{ "scene": "scene_id", "message": "explanation", "actors": ["actor1", "actor2"], "actions": ["action1", "action2"] }}
  ]
}}
Key Ideas: {chr(10).join(f'- {i}' for i in key_ideas)}
Domain: {domain}
Use 4-7 scenes, 2-5 actors per scene. Simple verbs: erupt, flow, cool, erode, etc.
"""
    try:
        raw = _generate_text(prompt, temperature=0.3, max_tokens=1500)
        cleaned = clean_json_output(raw)
        result = json.loads(cleaned)
        scenes = result.get("scenes", [])
        validated = []
        for i, scene in enumerate(scenes):
            if not isinstance(scene, dict):
                continue
            scene_id = scene.get("scene") or f"scene_{i + 1}"
            message = scene.get("message") or (key_ideas[i] if i < len(key_ideas) else "")
            actors = scene.get("actors", [])
            actions = scene.get("actions", [])
            if not isinstance(actors, list):
                actors = [str(actors)] if actors else []
            if not isinstance(actions, list):
                actions = [str(actions)] if actions else []
            while len(actions) < len(actors):
                actions.append("idle")
            while len(actors) < len(actions):
                actors.append("label")
            validated.append({"scene": scene_id, "message": message, "actors": actors[:8], "actions": actions[:8]})
        if not validated:
            validated.append({"scene": "intro", "message": topic or "Explanation", "actors": ["label"], "actions": ["appear"]})
        return validated
    except Exception as e:
        print(f"Error in plan_scenes_hybrid: {e}")
        import traceback
        traceback.print_exc()
        return [{"scene": f"scene_{i+1}", "message": str(idea), "actors": ["label"], "actions": ["appear"]} for i, idea in enumerate(key_ideas[:7])]


def _generate_timeline_for_actor(actor_type: str, animation: str, x: int, y: int, appear_delay: int = 0) -> list:
    """Generate timeline steps for an actor (simplified)."""
    FADE_IN_DURATION = 600
    ACTION_DELAY = 800
    timeline = [
        {"at": appear_delay, "action": "appear", "alpha": 0.0},
        {"at": appear_delay + FADE_IN_DURATION, "action": "appear", "alpha": 1.0},
        {"at": appear_delay + FADE_IN_DURATION + ACTION_DELAY, "action": animation or "idle"},
        {"at": appear_delay + FADE_IN_DURATION + ACTION_DELAY + 1500, "action": "idle"},
    ]
    return timeline


def _pick_actors_for_idea(idea: str) -> list:
    """Create actors for an idea using KEYWORD_VISUAL_MAP + layout defaults."""
    idea_lower = idea.lower()
    actors = []
    SEQUENTIAL_DELAY = 1200
    primary_actors = []

    # Collect primary conceptual actors for this idea
    for keywords, actor_type, animation in KEYWORD_VISUAL_MAP:
        if any(k in idea_lower for k in keywords):
            if not any(a_type == actor_type for a_type, _ in primary_actors):
                primary_actors.append((actor_type, animation))

    for idx, (actor_type, animation) in enumerate(primary_actors):
        # Use layout engine to assign sensible x, y, size, color
        props = get_actor_properties(actor_type, {})
        x = props.get("x", 400)
        y = props.get("y", 300)
        color = props.get("color")
        appear_delay = idx * SEQUENTIAL_DELAY
        actor = {
            "type": actor_type,
            "x": x,
            "y": y,
            "animation": animation or "idle",
            "color": color,
            "count": 1,
        }
        actor["timeline"] = _generate_timeline_for_actor(actor_type, animation or "idle", x, y, appear_delay)
        actors.append(actor)

    if not actors:
        # Fallback: a label centered on screen, with layout-derived color and fontSize
        props = get_actor_properties("label", {"text": idea})
        x = props.get("x", 400)
        y = props.get("y", 300)
        color = props.get("color")
        actor = {
            "type": "label",
            "x": x,
            "y": y,
            "animation": "appear",
            "color": color,
            "count": 1,
        }
        # Preserve optional text/fontSize if frontend uses them
        if "text" in props:
            actor["text"] = props["text"]
        if "fontSize" in props:
            actor["fontSize"] = props["fontSize"]
        actor["timeline"] = _generate_timeline_for_actor("label", "appear", x, y, 0)
        actors.append(actor)

    return actors


def _infer_environment(analysis: dict, idea: str) -> str:
    """Infer environment hint for a scene."""
    domain = (analysis.get("domain") or "").lower()
    text = idea.lower()
    if domain == "astronomy" or any(k in text for k in ["space", "orbit", "moon", "planet", "galaxy", "universe"]):
        return "space"
    if domain in {"earth_science", "physics"} or any(k in text for k in ["ground", "earth", "mountain", "ocean", "volcano"]):
        return "earth"
    return "default"


def plan_scenes(analysis: dict) -> list:
    """Stage 2: Visual scene planning – key ideas to scenes with actors."""
    key_ideas = analysis.get("keyIdeas") or []
    if not isinstance(key_ideas, list):
        key_ideas = [str(key_ideas)]
    scenes = []
    for idx, idea in enumerate(key_ideas):
        idea_str = str(idea).strip()
        if not idea_str:
            continue
        scene_id = f"scene_{idx + 1}"
        actors = _pick_actors_for_idea(idea_str)
        scenes.append({"id": scene_id, "text": idea_str, "actors": actors, "environment": _infer_environment(analysis, idea_str)})
    if not scenes:
        scenes.append({"id": "scene_1", "text": analysis.get("topic") or "Explanation", "actors": _pick_actors_for_idea(analysis.get("topic") or ""), "environment": "default"})
    return scenes


def _build_script_from_scenes(concept: str, analysis: dict, planned_scenes: list) -> dict:
    """Stage 3: Build script with timing from planned scenes."""
    num_scenes = max(1, min(len(planned_scenes), 7))
    base_duration = 7000
    scenes_out = []
    current_start = 0
    for i in range(num_scenes):
        scene = planned_scenes[i]
        duration = base_duration
        scene_out = {"id": scene["id"], "startTime": current_start, "duration": duration, "text": scene["text"], "actors": scene["actors"]}
        if "environment" in scene:
            scene_out["environment"] = scene["environment"]
        scenes_out.append(scene_out)
        current_start += duration
    return {"title": analysis.get("topic") or concept.strip(), "duration": current_start, "scenes": scenes_out}


def validate_json_script(script: dict) -> bool:
    """Validate and auto-fix JSON script structure."""
    if not isinstance(script, dict):
        return False
    if not all(f in script for f in ["title", "duration", "scenes"]):
        return False
    if not isinstance(script["scenes"], list) or len(script["scenes"]) < 1:
        return False
    total_time = 0
    for i, scene in enumerate(script["scenes"]):
        if not all(f in scene for f in ["id", "startTime", "duration", "text", "actors"]):
            return False
        if scene["startTime"] != total_time:
            scene["startTime"] = total_time
        total_time = scene["startTime"] + scene["duration"]
        if not isinstance(scene["actors"], list) or len(scene["actors"]) == 0:
            return False
        for j, actor in enumerate(scene["actors"]):
            if not all(f in actor for f in ["type", "x", "y"]):
                return False
            if "animation" not in actor and "timeline" not in actor:
                actor["animation"] = "idle"
            if actor["type"] not in VALID_ACTOR_TYPES:
                type_mapping = {"plants": "plant", "sunlight": "sun", "water": "molecule", "co2": "molecule", "oxygen": "molecule"}
                orig_type = actor["type"].lower()
                if orig_type in type_mapping:
                    actor["type"] = type_mapping[orig_type]
                    if actor["type"] == "molecule":
                        actor["moleculeType"] = "water" if orig_type == "water" else "co2" if orig_type == "co2" else "o2"
                else:
                    return False
            if "animation" in actor and actor["animation"] not in VALID_ANIMATIONS:
                actor["animation"] = "idle"
    if script["duration"] != total_time:
        script["duration"] = total_time
    return True


def _generate_animation_script_legacy(concept: str) -> Optional[dict]:
    """Comprehensive script generation via one Gemini call."""
    try:
        prompt = build_comprehensive_prompt(concept)
        raw = _generate_text(prompt, temperature=0.3, max_tokens=4000)
        cleaned = clean_json_output(raw)
        script = json.loads(cleaned)
        if not validate_json_script(script):
            return None
        return script
    except Exception as e:
        print(f"Error generating script: {e}")
        import traceback
        traceback.print_exc()
        return None


def generate_animation_script(concept: str, use_comprehensive: bool = True) -> Optional[dict]:
    """Generate animation script. Default: comprehensive LLM script."""
    if use_comprehensive:
        return _generate_animation_script_legacy(concept)
    try:
        analysis = analyze_concept(concept)
        if not analysis or not analysis.get("keyIdeas"):
            return _generate_animation_script_legacy(concept)
        planned_scenes = plan_scenes(analysis)
        if not planned_scenes:
            return _generate_animation_script_legacy(concept)
        script = _build_script_from_scenes(concept, analysis, planned_scenes)
        if not validate_json_script(script):
            return _generate_animation_script_legacy(concept)
        return script
    except Exception as e:
        print(f"Error in structured pipeline: {e}")
        return _generate_animation_script_legacy(concept)
