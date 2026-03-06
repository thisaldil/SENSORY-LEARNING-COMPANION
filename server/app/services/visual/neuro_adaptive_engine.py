"""
Neuro-Adaptive Visual Engine (Member 2)

Transforms Tier 3 transmuted text + cognitive state into an animation script JSON
that the React Native canvas/Lottie layer can render live.

Research framing:
- OVERLOAD  -> Coherence + Signaling, low visual salience
- OPTIMAL   -> Segmenting + Signaling, medium salience
- LOW_LOAD  -> Personalization + Generative processing, high salience

This engine does NOT generate video files. It produces a structured JSON manifest
matching the existing AnimationScript shape:
{
  "title": str,
  "duration": int,
  "scenes": [
    {
      "id": str,
      "startTime": int,
      "duration": int,
      "text": str,
      "actors": [...],
      "environment": str,
      "meta": {
        "cognitiveState": "OVERLOAD" | "OPTIMAL" | "LOW_LOAD",
        "tier": "Tier 1/2/3 ...",
        "ctmlPrinciples": [...],
        "salienceLevel": "low" | "medium" | "high"
      }
    }
  ]
}
"""
from __future__ import annotations

from typing import List, Tuple, Dict, Any, Optional

from beanie import PydanticObjectId

from app.services.visual.ai_generator import _pick_actors_for_idea
from app.services.visual.visual_enricher import enrich_scene
from app.models.visual.neuro_adaptive import NeuroAdaptiveVisualScript


def _normalize_state(cognitive_state: str) -> str:
    state = (cognitive_state or "").upper().strip()
    if state in {"OVERLOAD", "HIGH_LOAD"}:
        return "OVERLOAD"
    if state in {"LOW_LOAD", "UNDERLOAD"}:
        return "LOW_LOAD"
    return "OPTIMAL"


def _map_state_to_tier(state: str) -> str:
    if state == "OVERLOAD":
        return "Tier 3 - Cognitive Offloading"
    if state == "LOW_LOAD":
        return "Tier 1 - Enrichment and Elaboration"
    return "Tier 2 - Moderate Simplification"


def _parse_bullets(transmuted_text: str) -> List[str]:
    """
    Parse Tier‑3 style bullet list into clean bullet strings.
    Accepts bullets that start with '*', '-', or '•'.
    """
    bullets: List[str] = []
    for raw_line in (transmuted_text or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line[0] in {"*", "-", "•"}:
            line = line[1:].strip()
        if line:
            bullets.append(line)
    return bullets


def _chunk_bullets_for_state(bullets: List[str], state: str) -> List[List[str]]:
    """
    Apply CTML‑aware chunking strategy:
    - OVERLOAD: 1 bullet per scene (maximal chunking, strong temporal contiguity)
    - OPTIMAL:  2 bullets per scene (segmenting)
    - LOW_LOAD: 3 bullets per scene (slightly richer scenes to foster generative load)
    """
    if not bullets:
        return []
    if state == "OVERLOAD":
        size = 1
    elif state == "LOW_LOAD":
        size = 3
    else:
        size = 2
    return [bullets[i : i + size] for i in range(0, len(bullets), size)]


def _scene_meta(state: str) -> Dict[str, Any]:
    """Return CTML‑oriented meta block for a scene."""
    if state == "OVERLOAD":
        return {
            "cognitiveState": "OVERLOAD",
            "tier": _map_state_to_tier(state),
            "ctmlPrinciples": ["coherence", "signaling", "temporal_contiguity", "redundancy"],
            "salienceLevel": "low",
        }
    if state == "LOW_LOAD":
        return {
            "cognitiveState": "LOW_LOAD",
            "tier": _map_state_to_tier(state),
            "ctmlPrinciples": ["personalization", "generative_processing", "segmenting"],
            "salienceLevel": "high",
        }
    return {
        "cognitiveState": "OPTIMAL",
        "tier": _map_state_to_tier(state),
        "ctmlPrinciples": ["segmenting", "signaling", "spatial_contiguity"],
        "salienceLevel": "medium",
    }


def _environment_for_state(state: str) -> str:
    """
    Coarse control over background complexity:
    - OVERLOAD: 'minimal'   (flat background, few elements)
    - OPTIMAL:  'default'   (moderate context)
    - LOW_LOAD: 'rich'      (more motion & context to re‑engage)
    """
    if state == "OVERLOAD":
        return "minimal"
    if state == "LOW_LOAD":
        return "rich"
    return "default"


def _add_personalization_avatar(actors: List[Dict[str, Any]]) -> None:
    """
    LOW_LOAD only: add a friendly avatar actor (e.g. Jax) that can speak
    or point at elements. Uses 'animal' type to stay within VALID_ACTOR_TYPES.
    """
    has_avatar = any(a.get("type") == "animal" for a in actors)
    if has_avatar:
        return
    avatar = {
        "type": "animal",
        "x": 80,
        "y": 380,
        "animation": "wave",
        "color": "#FFB74D",
        "label": "Jax",
    }
    actors.insert(0, avatar)


def _build_scenes_from_chunks(
    chunks: List[List[str]],
    state: str,
    concept_analysis: Optional[Dict[str, Any]] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Turn bullet chunks into scene list following AnimationScript shape.
    Uses keyword‑based visual mapping to keep latency low.
    """
    scenes: List[Dict[str, Any]] = []
    current_start = 0

    # Base durations in ms; we then clamp for research‑sane pacing.
    if state == "OVERLOAD":
        base_duration = 4500
    elif state == "LOW_LOAD":
        base_duration = 7000
    else:
        base_duration = 5500

    MIN_DUR = 3500
    MAX_DUR = 9000

    for idx, chunk in enumerate(chunks):
        bullet_text = " ".join(chunk).strip()
        if not bullet_text:
            continue

        # Leverage existing keyword‑to‑visual mapper for each bullet
        # and pool actors into one scene.
        actors: List[Dict[str, Any]] = []
        for idea in chunk:
            idea_actors = _pick_actors_for_idea(idea)
            actors.extend(idea_actors)

        # OVERLOAD: cap visual clutter to 2 key actors.
        if state == "OVERLOAD":
            actors = actors[:2]

        # LOW_LOAD: inject avatar to satisfy Personalization Principle.
        if state == "LOW_LOAD":
            _add_personalization_avatar(actors)

        duration = max(MIN_DUR, min(base_duration, MAX_DUR))

        scene = {
            "id": f"scene_{idx + 1}",
            "startTime": current_start,
            "duration": duration,
            "text": bullet_text,
            "actors": actors,
            "environment": _environment_for_state(state),
            "meta": _scene_meta(state),
        }
        # Enrich with domain-specific visuals (e.g. photosynthesis visuals)
        enriched_scene = enrich_scene(scene, concept_analysis or {})
        scenes.append(enriched_scene)
        current_start += duration

    return scenes, current_start


def generate_neuro_adaptive_script(
    transmuted_text: str,
    cognitive_state: str,
    *,
    concept: str | None = None,
) -> Dict[str, Any]:
    """
    Public entry point for Member 2.

    Inputs:
    - transmuted_text: Tier‑3 cognitive offloading bullets from Member 1
    - cognitive_state: "OVERLOAD" | "OPTIMAL" | "LOW_LOAD"

    Output: JSON animation script ready to be sent to the mobile app.
    """
    state = _normalize_state(cognitive_state)
    bullets = _parse_bullets(transmuted_text)
    if not bullets:
        # Fallback: treat full text as a single "idea".
        bullets = [transmuted_text.strip() or "Explanation"]

    # Lightweight concept analysis for the enricher (topic/domain hints)
    text_lower = (transmuted_text or "").lower()
    topic_hint = (concept or "").lower()
    domain = "generic"
    if "photosynthesis" in text_lower or "chloroplast" in text_lower:
        topic_hint = "photosynthesis"
        domain = "biology"
    elif any(k in text_lower for k in ["gravity", "force", "mass", "weight"]):
        domain = "physics"
    elif any(k in text_lower for k in ["rock", "magma", "sediment"]):
        domain = "earth_science"
    concept_analysis = {"topic": topic_hint, "domain": domain}

    chunks = _chunk_bullets_for_state(bullets, state)
    scenes, total_duration = _build_scenes_from_chunks(chunks, state, concept_analysis)

    title = (concept or "Adaptive Visual Explanation").strip() or "Adaptive Visual Explanation"

    return {
        "title": title,
        "duration": total_duration,
        "scenes": scenes,
    }


async def log_neuro_adaptive_script(
    script: Dict[str, Any],
    *,
    cognitive_state: str,
    tier: str,
    concept: str,
    lesson_id: Optional[str] = None,
    student_id: Optional[str] = None,
    session_id: Optional[str] = None,
) -> None:
    """
    Persist a neuro-adaptive visual script for later retrieval by the frontend.
    """
    lesson_obj_id: Optional[PydanticObjectId] = None
    student_obj_id: Optional[PydanticObjectId] = None
    if lesson_id:
        try:
            lesson_obj_id = PydanticObjectId(lesson_id)
        except Exception:
            lesson_obj_id = None
    if student_id:
        try:
            student_obj_id = PydanticObjectId(student_id)
        except Exception:
            student_obj_id = None

    doc = NeuroAdaptiveVisualScript(
        lesson_id=lesson_obj_id,
        student_id=student_obj_id,
        session_id=session_id,
        concept=concept,
        cognitive_state=cognitive_state,
        tier=tier,
        script=script,
    )
    await doc.insert()

