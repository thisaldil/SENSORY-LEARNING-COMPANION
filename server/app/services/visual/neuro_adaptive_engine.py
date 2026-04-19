"""
Neuro-Adaptive Visual Engine (Member 2)

Transforms Tier 3 transmuted text + cognitive state into an animation script JSON
that the React Native canvas/Lottie layer can render live.

Research framing:
- OVERLOAD  -> Coherence + Signaling, low visual salience   → more scenes, shorter each
- OPTIMAL   -> Segmenting + Signaling, medium salience      → balanced scenes, medium length
- LOW_LOAD  -> Personalization + Generative processing, high salience → rich scenes, longer text

FIX LOG:
- OPTIMAL and LOW_LOAD were generating too few scenes (sometimes 1-2) because:
    a) Non-bullet prose was collapsed into a single bullet fallback
    b) Chunking size was too large relative to input sentence count
    c) Scene text was not enriched/expanded — raw bullets were used as-is

This revision:
    1. Splits prose more aggressively into semantic idea units
    2. Enforces minimum scene counts per cognitive state
    3. Expands each scene's text into a full, multi-sentence narration string
    4. Adds connector phrases and elaboration so text is never a single short clause
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from beanie import PydanticObjectId

from app.models.visual.neuro_adaptive import NeuroAdaptiveVisualScript
from app.services.visual.ai_generator import _pick_actors_for_idea
from app.services.visual.visual_enricher import enrich_scene

# ---------------------------------------------------------------------------
# Minimum scene targets per cognitive state
# These ensure OPTIMAL and LOW_LOAD always generate enough scenes
# ---------------------------------------------------------------------------
MIN_SCENES: Dict[str, int] = {
    "OVERLOAD": 5,   # Many short scenes — reduce each load spike
    "OPTIMAL": 4,    # Balanced segmenting
    "LOW_LOAD": 3,   # Fewer but richer, more generative
}

# Target words per scene text (narration richness)
TARGET_WORDS_PER_SCENE: Dict[str, int] = {
    "OVERLOAD": 20,   # Short, clear sentences — minimal redundancy
    "OPTIMAL": 40,    # Medium elaboration
    "LOW_LOAD": 60,   # Rich elaboration to re-engage the learner
}


# ---------------------------------------------------------------------------
# State normalisation
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Text parsing helpers
# ---------------------------------------------------------------------------

def _parse_bullets(transmuted_text: str) -> List[str]:
    """Parse explicit bullet lists (* - •)."""
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


def _split_into_sentences(text: str) -> List[str]:
    """
    Split prose into individual sentences using punctuation boundaries.
    Also handles numbered lists (e.g. '1. Plants need sunlight.')
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return []

    # Remove numbered list prefixes: "1.", "2)", etc.
    cleaned = re.sub(r"^\s*\d+[\.\)]\s+", "", cleaned, flags=re.MULTILINE)

    # Split on sentence-ending punctuation followed by whitespace or end of string
    raw = re.split(r"(?<=[.!?])\s+", cleaned)

    sentences: List[str] = []
    for s in raw:
        s_clean = s.strip()
        if s_clean:
            sentences.append(s_clean)
    return sentences


def _split_into_clauses(text: str) -> List[str]:
    """
    More aggressive split — also splits on commas and semicolons that
    introduce new ideas. Used when sentence-level split still yields too
    few chunks relative to the required minimum scene count.
    """
    sentences = _split_into_sentences(text)
    clauses: List[str] = []
    for sent in sentences:
        # Split further on semicolons, colons, or 'and'/'but'/'so' conjunctions
        parts = re.split(r"(?:;\s*|:\s*|\s+(?:and|but|so|because|which|that)\s+)", sent)
        for p in parts:
            p_clean = p.strip().strip(",").strip()
            if len(p_clean.split()) >= 3:  # Minimum viable clause
                clauses.append(p_clean)
    return clauses if clauses else sentences


# ---------------------------------------------------------------------------
# Scene text elaboration
# ---------------------------------------------------------------------------

# Connector phrases that enrich scene narration without introducing new facts
_ELABORATION_CONNECTORS = [
    "This means that",
    "In other words,",
    "To put it simply,",
    "What this shows us is that",
    "Think of it this way:",
    "This is important because",
    "As a result,",
    "More specifically,",
]

_ELABORATION_BY_STATE: Dict[str, List[str]] = {
    "OVERLOAD": [
        "Keep this in mind:",
        "Simply put,",
        "Remember:",
        "Focus on this key idea:",
    ],
    "OPTIMAL": [
        "This means that",
        "To understand this better,",
        "In other words,",
        "As a result,",
    ],
    "LOW_LOAD": [
        "Let's explore this further.",
        "Think about why this matters.",
        "This connects to a bigger picture:",
        "Consider how this works in real life:",
        "What's fascinating here is that",
    ],
}


def _elaborate_text(core_ideas: List[str], state: str, idx: int) -> str:
    """
    Take a list of raw idea strings and expand them into a richer narration
    that meets the TARGET_WORDS_PER_SCENE threshold for the given state.

    Strategy:
    - Join ideas naturally with connective language
    - Prepend a state-appropriate opener for variety (round-robin by idx)
    - Append an elaboration sentence if still under word target
    """
    target_words = TARGET_WORDS_PER_SCENE[state]
    connectors = _ELABORATION_BY_STATE.get(state, _ELABORATION_CONNECTORS)

    # Start with the joined raw text
    combined = " ".join(core_ideas).strip()

    # Ensure sentence ends with punctuation
    if combined and combined[-1] not in ".!?":
        combined += "."

    # Add opener for scene variety (skip for idx==0 on OVERLOAD to stay minimal)
    if state != "OVERLOAD" or idx > 0:
        opener = connectors[idx % len(connectors)]
        # Only prepend if the opener doesn't duplicate the start
        if not combined.lower().startswith(opener.lower().rstrip(":")):
            combined = f"{opener} {combined}"

    # Pad with elaboration sentence if under word target
    word_count = len(combined.split())
    if word_count < target_words:
        elaboration = _generate_elaboration(combined, state)
        if elaboration:
            combined = f"{combined} {elaboration}"

    return combined.strip()


def _generate_elaboration(existing_text: str, state: str) -> str:
    """
    Rule-based elaboration sentence generator.
    Appends a relevant closing thought based on state and keywords in existing_text.
    """
    text_lower = existing_text.lower()

    # Domain-aware elaborations
    if "light" in text_lower or "sunlight" in text_lower or "energy" in text_lower:
        elaborations = {
            "OVERLOAD": "Energy from light powers the process.",
            "OPTIMAL": "Light energy is absorbed and converted into a usable form that fuels growth.",
            "LOW_LOAD": (
                "Light energy is the driving force behind this entire process — "
                "without it, the conversion of raw materials into usable energy would not be possible, "
                "making sunlight one of the most critical ingredients in the natural world."
            ),
        }
    elif "plant" in text_lower or "leaf" in text_lower or "leaves" in text_lower:
        elaborations = {
            "OVERLOAD": "Plants do this inside their leaves.",
            "OPTIMAL": "Leaves are specially structured to capture as much light as possible for this process.",
            "LOW_LOAD": (
                "Leaves have evolved an intricate internal structure with layers of cells, "
                "each playing a specific role in capturing light and enabling the chemical reactions "
                "that sustain the plant's life and growth."
            ),
        }
    elif "oxygen" in text_lower or "co2" in text_lower or "carbon" in text_lower:
        elaborations = {
            "OVERLOAD": "This gas exchange supports life.",
            "OPTIMAL": "This exchange of gases is essential for maintaining life on Earth.",
            "LOW_LOAD": (
                "The exchange of carbon dioxide and oxygen is a cornerstone of life on Earth — "
                "nearly all living organisms depend on this balance, "
                "making it one of the most important chemical cycles in our ecosystem."
            ),
        }
    elif "force" in text_lower or "gravity" in text_lower or "mass" in text_lower:
        elaborations = {
            "OVERLOAD": "This force acts on all objects.",
            "OPTIMAL": "This fundamental force shapes how objects move and interact.",
            "LOW_LOAD": (
                "This force is one of the four fundamental forces of nature and governs "
                "the motion of everything from falling apples to orbiting planets, "
                "making it a cornerstone of our understanding of the physical universe."
            ),
        }
    else:
        elaborations = {
            "OVERLOAD": "This is a key concept to remember.",
            "OPTIMAL": "Understanding this concept helps build a foundation for deeper learning.",
            "LOW_LOAD": (
                "Understanding this concept opens the door to deeper connections "
                "across many related topics, helping to build a richer and more complete "
                "picture of how the world works."
            ),
        }

    return elaborations.get(state, "")


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def _chunk_bullets_for_state(ideas: List[str], state: str) -> List[List[str]]:
    """
    CTML-aware chunking that also enforces minimum scene counts:

    - OVERLOAD: 1 idea per scene (temporal contiguity, max segmenting)
    - OPTIMAL:  2 ideas per scene (balanced segmenting)
    - LOW_LOAD: 3 ideas per scene (generative processing, richer scenes)

    If chunking produces fewer than MIN_SCENES[state], we re-chunk at size=1
    and group only enough ideas per scene to still hit the minimum scene count.
    """
    if not ideas:
        return []

    min_scenes = MIN_SCENES[state]

    if state == "OVERLOAD":
        chunk_size = 1
    elif state == "LOW_LOAD":
        chunk_size = 3
    else:
        chunk_size = 2

    chunks = [ideas[i: i + chunk_size] for i in range(0, len(ideas), chunk_size)]

    # If we're under the minimum scene count, split more aggressively
    if len(chunks) < min_scenes and len(ideas) >= min_scenes:
        # Re-chunk at size 1 to maximise scenes, then re-merge to hit exactly min_scenes
        chunks = [[idea] for idea in ideas]
        # Optionally re-merge tail if we have far more than needed
        if len(chunks) > min_scenes * 3:
            new_size = max(1, len(ideas) // min_scenes)
            chunks = [ideas[i: i + new_size] for i in range(0, len(ideas), new_size)]

    return chunks


# ---------------------------------------------------------------------------
# Scene metadata
# ---------------------------------------------------------------------------

def _scene_meta(state: str) -> Dict[str, Any]:
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
    if state == "OVERLOAD":
        return "minimal"
    if state == "LOW_LOAD":
        return "rich"
    return "default"


def _add_personalization_avatar(actors: List[Dict[str, Any]]) -> None:
    """LOW_LOAD only: inject a friendly avatar actor."""
    has_avatar = any(a.get("type") == "animal" for a in actors)
    if has_avatar:
        return
    actors.insert(0, {
        "type": "animal",
        "x": 80,
        "y": 380,
        "animation": "wave",
        "color": "#FFB74D",
        "label": "Jax",
    })


# ---------------------------------------------------------------------------
# Scene builder
# ---------------------------------------------------------------------------

def _build_scenes_from_chunks(
    chunks: List[List[str]],
    state: str,
    concept_analysis: Optional[Dict[str, Any]] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Build scenes from idea chunks.

    Key changes vs original:
    - `text` field is now the output of `_elaborate_text()` — always multi-sentence and rich
    - Duration is tied to word count of the elaborated text for natural pacing
    - OVERLOAD durations remain short; OPTIMAL and LOW_LOAD scale longer
    """
    scenes: List[Dict[str, Any]] = []
    current_start = 0

    # Base ms-per-word for reading/narration pacing (approx. 130 wpm)
    MS_PER_WORD = 460  # ~130 words per minute

    # Hard floor/ceiling per state (ms)
    DURATION_RANGES: Dict[str, Tuple[int, int]] = {
        "OVERLOAD": (3500, 5500),
        "OPTIMAL": (5000, 8000),
        "LOW_LOAD": (7000, 12000),
    }
    floor, ceiling = DURATION_RANGES[state]

    for idx, chunk in enumerate(chunks):
        if not chunk:
            continue

        # Elaborate text for this scene
        scene_text = _elaborate_text(chunk, state, idx)

        # Duration based on word count
        word_count = len(scene_text.split())
        duration = max(floor, min(word_count * MS_PER_WORD, ceiling))

        # Build actors from each idea in the chunk
        actors: List[Dict[str, Any]] = []
        for idea in chunk:
            actors.extend(_pick_actors_for_idea(idea))

        if state == "OVERLOAD":
            actors = actors[:2]  # Cap visual clutter
        elif state == "LOW_LOAD":
            _add_personalization_avatar(actors)

        scene: Dict[str, Any] = {
            "id": f"scene_{idx + 1}",
            "startTime": current_start,
            "duration": duration,
            "text": scene_text,
            "actors": actors,
            "environment": _environment_for_state(state),
            "meta": _scene_meta(state),
        }

        enriched = enrich_scene(scene, concept_analysis or {})
        scenes.append(enriched)
        current_start += duration

    return scenes, current_start


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_neuro_adaptive_script(
    transmuted_text: str,
    cognitive_state: str,
    *,
    concept: str | None = None,
) -> Dict[str, Any]:
    """
    Public entry point for Member 2.

    Inputs:
    - transmuted_text: text from Member 1 (may be bullets OR prose)
    - cognitive_state:  "OVERLOAD" | "OPTIMAL" | "LOW_LOAD"

    Output: JSON animation script ready for the mobile app.
    """
    state = _normalize_state(cognitive_state)
    min_scenes = MIN_SCENES[state]

    # ── Step 1: Extract ideas ────────────────────────────────────────────────
    ideas = _parse_bullets(transmuted_text)

    if not ideas:
        # Prose path — split into sentences first
        ideas = _split_into_sentences(transmuted_text)

    # If still under minimum scenes target, split more aggressively into clauses
    if len(ideas) < min_scenes:
        clause_ideas = _split_into_clauses(transmuted_text)
        if len(clause_ideas) >= len(ideas):
            ideas = clause_ideas

    # Ultimate fallback
    if not ideas:
        ideas = [transmuted_text.strip() or "Explanation"]

    # ── Step 2: Concept / domain analysis ───────────────────────────────────
    text_lower = (transmuted_text or "").lower()
    concept_lower = (concept or "").lower()
    topic_hint = concept_lower
    domain = "generic"

    photosynth_core = ["photosynthesis", "chloroplast", "chlorophyll"]
    photosynth_signals = ["carbon dioxide", "co2", "glucose", "sugar", "oxygen", "sunlight", "light energy"]

    if (
        any(k in text_lower for k in photosynth_core)
        or any(k in concept_lower for k in photosynth_core)
        or (
            any(k in text_lower for k in ["plant", "plants"])
            and any(k in text_lower for k in photosynth_signals)
        )
    ):
        topic_hint = "photosynthesis"
        domain = "biology"
    elif any(k in text_lower for k in ["gravity", "force", "mass", "weight"]) or "gravity" in concept_lower:
        domain = "physics"
    elif any(k in text_lower for k in ["rock", "magma", "sediment"]) or any(
        k in concept_lower for k in ["rock cycle", "rock", "magma", "sediment"]
    ):
        domain = "earth_science"

    concept_analysis = {"topic": topic_hint, "domain": domain}

    # ── Step 3: Chunk and build scenes ───────────────────────────────────────
    chunks = _chunk_bullets_for_state(ideas, state)
    scenes, total_duration = _build_scenes_from_chunks(chunks, state, concept_analysis)

    title = (concept or "Adaptive Visual Explanation").strip() or "Adaptive Visual Explanation"

    return {
        "title": title,
        "duration": total_duration,
        "scenes": scenes,
    }


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------

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
    """Persist a neuro-adaptive visual script for later retrieval by the frontend."""
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