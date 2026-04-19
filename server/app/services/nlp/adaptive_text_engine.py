"""
Adaptive Text Engine – Hybrid NLP + LLM Pipeline.

Implements:
- Phase 1: NLP analysis (readability, dependency distance, TF‑IDF keywords)
- Phase 2: State router -> Tier 1 / Tier 2 / Tier 3
- Phase 3: LLM transmutation 
- Phase 4: Output validator ensuring keyword preservation
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional

import numpy as np
from beanie import PydanticObjectId
from sklearn.feature_extraction.text import TfidfVectorizer

try:
    import spacy
except ImportError:  # pragma: no cover - handled gracefully at runtime
    spacy = None  # type: ignore

try:
    import textstat  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    textstat = None  # type: ignore

from app.models.cognitive_load.content import TransmutedContent
from app.models.user import User
from app.services.nlp.text_llm_client import generate_text


_NLP = None


def _get_nlp():
    """Lazy‑load spaCy English model; degrade gracefully if unavailable."""
    global _NLP
    if _NLP is not None:
        return _NLP
    if spacy is None:
        return None
    try:
        _NLP = spacy.load("en_core_web_sm")
    except Exception:
        # Model not installed – caller will fall back to safe defaults.
        _NLP = None
    return _NLP


def _compute_flesch_kincaid_grade(text: str) -> float:
    """Compute Flesch‑Kincaid grade with safe fallback."""
    cleaned = (text or "").strip()
    if not cleaned:
        return 0.0
    if textstat is not None:
        try:
            grade = float(textstat.flesch_kincaid_grade(cleaned))
            if np.isnan(grade):
                return 0.0
            return max(0.0, min(18.0, grade))
        except Exception:
            pass
    # Lightweight heuristic fallback if textstat is not installed.
    words = cleaned.split()
    avg_word_len = np.mean([len(w) for w in words]) if words else 0.0
    approx_grade = 0.5 * avg_word_len + 3.0
    return float(max(0.0, min(18.0, approx_grade)))


def _compute_dependency_distance(text: str) -> float:
    """Average normalized dependency distance as a proxy for syntactic load."""
    nlp = _get_nlp()
    if nlp is None:
        return 0.0
    doc = nlp(text)
    distances: List[float] = []
    for sent in doc.sents:
        roots = [t for t in sent if t.dep_ == "ROOT"]
        for root in roots:
            if not list(root.children):
                continue
            max_gap = max(abs(child.i - root.i) for child in root.children)
            distances.append(float(max_gap))
    if not distances:
        return 0.0
    avg_distance = float(np.mean(distances))
    # Normalize by a conservative upper bound (25 tokens apart).
    return float(max(0.0, min(1.0, avg_distance / 25.0)))


def _extract_keywords_tfidf(text: str, top_k: int = 10) -> List[str]:
    """TF‑IDF keyword extraction on a single document."""
    cleaned = (text or "").strip()
    if not cleaned:
        return []
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=1000,
    )
    try:
        tfidf_matrix = vectorizer.fit_transform([cleaned])
    except ValueError:
        return []
    scores = tfidf_matrix.toarray()[0]
    feature_names = vectorizer.get_feature_names_out()
    if not len(feature_names):
        return []
    top_indices = np.argsort(scores)[::-1][:top_k]
    keywords = [feature_names[i] for i in top_indices if scores[i] > 0]
    return [k for k in keywords if k.strip()]


@dataclass
class AnalysisResult:
    flesch_kincaid_grade: float
    dependency_distance: float  # normalized 0–1
    complexity_score: float  # normalized 0–1
    keywords: List[str]


def analyze_text(text: str) -> AnalysisResult:
    """Phase 1 – deterministic NLP analysis."""
    fk_grade = _compute_flesch_kincaid_grade(text)
    dep_dist = _compute_dependency_distance(text)
    # Normalize grade to [0, 1] using an 18‑grade cap (roughly grad‑school ceiling).
    grade_norm = fk_grade / 18.0 if fk_grade > 0 else 0.0
    complexity = float(max(0.0, min(1.0, 0.6 * grade_norm + 0.4 * dep_dist)))
    keywords = _extract_keywords_tfidf(text)
    return AnalysisResult(
        flesch_kincaid_grade=fk_grade,
        dependency_distance=dep_dist,
        complexity_score=complexity,
        keywords=keywords,
    )


def _infer_topic_and_title(raw_text: str, analysis: AnalysisResult) -> Tuple[str, str]:
    """
    Infer a reasonable topic and lesson_title from the text itself.

    - Topic: concept keyword inferred from TF-IDF, with simple domain-aware rules.
    - Title: 'Introduction to {topic}' as a simple, explainable rule.
    """
    topic = ""
    # Prefer gravity-related terms when present, since many physics texts like this use
    # both "force" and "gravity" but the pedagogical concept is gravity.
    lower_keywords = [k.lower() for k in analysis.keywords]
    gravity_keywords = [
        k for k in lower_keywords if "gravity" in k or "gravitational" in k
    ]
    if gravity_keywords:
        topic = gravity_keywords[0].strip().title()
    elif analysis.keywords:
        topic = analysis.keywords[0].strip().title()
    if not topic:
        words = (raw_text or "").strip().split()
        topic = " ".join(words[:4]).strip().title() or "Untitled Concept"
    lesson_title = f"Introduction to {topic}"
    return topic, lesson_title


def _route_tier(cognitive_state: str, complexity_score: float) -> str:
    """Phase 2 – simple, explicit routing logic."""
    state = (cognitive_state or "").upper()
    if state == "OVERLOAD":
        # For OVERLOAD, always offload as much as possible:
        # consistently use Tier 3 so Member 2 receives
        # short, chunked bullets instead of long paragraphs.
        return "Tier 3 - Cognitive Offloading"
    if state == "LOW_LOAD":
        if complexity_score <= 0.3:
            return "Tier 1 - Enrichment and Elaboration"
        return "Tier 2 - Moderate Simplification"
    # OPTIMAL or unknown – keep structure but tidy phrasing.
    return "Tier 2 - Moderate Simplification"


def _build_prompt(text: str, tier: str, keywords: List[str]) -> str:
    """Phase 3 – Tier‑aware LLM prompt."""
    keywords_str = ", ".join(keywords[:15]) if keywords else ""
    base_instructions = """
You are an expert science educator who adapts explanations to a learner's current cognitive load.
Preserve scientific accuracy and keep all core concepts intact.
"""
    if "Tier 3" in tier:
        tier_instructions = """
Tier 3 - Cognitive Offloading (OVERLOAD state):
- You are a Grade 2 teacher.
- Your goal is Cognitive Offloading.
- Use a list of bullet points.
- Start each bullet with "- ".
- Output 4–9 bullets.
- Each bullet is one short, simple sentence (max ~15 words).
- Keep all important science words and processes from the original.
- Each bullet should describe ONE clear idea, step, or relation in the explanation.
- Avoid advanced academic wording; prefer concrete, everyday language a Grade 2 student understands.
- Output plain text ONLY. Do NOT use markdown (no bold, no italics, no headers).
"""
    elif "Tier 1" in tier:
        tier_instructions = """
Tier 1 - Enrichment and Elaboration:
- Slightly increase richness and precision of language without making it harder to read.
- Add 1–2 short clarifying phrases or analogies that deepen understanding.
- Keep sentences reasonably short and direct.
- Do NOT repeat or duplicate any ideas already stated.
- Output plain prose ONLY. Do NOT use markdown (no bold, no italics, no bullet points, no headers).
"""
    else:
        tier_instructions = """
Tier 2 - Moderate Simplification:
- Rewrite as clean, plain prose. Output plain text ONLY — no markdown, no bold, no italics, no bullet points, no headers.
- Simplify long or complex sentences into shorter, clearer ones while keeping the original meaning intact.
- Remove unnecessary technical jargon, but preserve all key scientific terms.
- Do NOT repeat or duplicate any ideas already stated.
- Do NOT add new information that was not in the original text.
- Each sentence should introduce exactly one clear idea.
- Aim for a reading level a motivated middle-school student would find comfortable.
"""
    keyword_hint = ""
    if keywords_str:
        keyword_hint = f"""
The following terms are core and MUST remain present in some form in your answer:
{keywords_str}
"""
    return (
        base_instructions
        + tier_instructions
        + keyword_hint
        + f"\nOriginal text:\n\"\"\"{text.strip()}\"\"\"\n\nTransformed text:"
    )


def _compute_keyword_preservation(
    original_keywords: List[str], transmuted_text: str
) -> Tuple[List[str], List[str]]:
    """Phase 4 – keyword preservation check.
    
    For multi-word keywords (bigrams), checks if ALL component words appear
    individually — they rarely survive verbatim after rewriting.
    """
    if not original_keywords:
        return [], []
    lower_out = transmuted_text.lower()
    kept: List[str] = []
    dropped: List[str] = []
    for kw in original_keywords:
        token = kw.lower().strip()
        if not token:
            continue
        parts = token.split()
        # Bigrams: preserved if every component word appears somewhere in output
        if len(parts) > 1:
            preserved = all(part in lower_out for part in parts)
        else:
            preserved = token in lower_out
        if preserved:
            kept.append(kw)
        else:
            dropped.append(kw)
    return kept, dropped


def transmute_text(text: str, cognitive_state: str) -> dict:
    """
    Public orchestrator used by the FastAPI endpoint.

    Returns a dict ready to be fed into TransmuteResponse.
    """
    analysis = analyze_text(text)
    tier = _route_tier(cognitive_state, analysis.complexity_score)
    prompt = _build_prompt(text, tier, analysis.keywords)
    llm_error: Optional[str] = None
    try:
        llm_output = generate_text(prompt, temperature=0.3, max_tokens=2048)
    except Exception as e:  # pragma: no cover - network/quota/runtime dependent
        # Graceful degradation: keep analysis metrics but fall back to original text.
        # This ensures the endpoint remains usable even if the LLM quota is exhausted.
        print(f"[AdaptiveTextEngine] LLM call failed, falling back to original text: {e}")
        llm_error = str(e)
        llm_output = text
        tier = f"{tier} (LLM fallback: original text)"
    preserved, _ = _compute_keyword_preservation(analysis.keywords, llm_output)
    return {
        "original_complexity_score": analysis.complexity_score,
        "flesch_kincaid_grade": analysis.flesch_kincaid_grade,
        "dependency_distance": analysis.dependency_distance,
        "keywords_preserved": preserved,
        "transmuted_text": llm_output,
        "tier_applied": tier,
        "llm_error": llm_error,
    }


async def log_transmutation_event(
    text: str,
    cognitive_state: str,
    lesson_id: Optional[str] = None,
    student_id: Optional[str] = None,
    session_id: Optional[str] = None,
) -> dict:
    """
    Run a single-state transmutation and persist the full research record.

    Returns the same dict shape as `transmute_text` so the API response
    remains unchanged, while MongoDB receives a detailed audit trail.
    """
    # Analysis on original text (for input + quality metrics)
    original_analysis = analyze_text(text)
    result = transmute_text(text, cognitive_state)
    # Analysis on transmuted text to compute complexity reduction
    post_analysis = analyze_text(result["transmuted_text"])

    kept = result["keywords_preserved"]
    # Compute dropped keywords relative to the original keyword set
    _, dropped = _compute_keyword_preservation(original_analysis.keywords, result["transmuted_text"])

    if original_analysis.keywords:
        keyword_preservation_rate = len(kept) / len(original_analysis.keywords)
    else:
        keyword_preservation_rate = 1.0

    complexity_reduction = max(
        0.0, original_analysis.complexity_score - post_analysis.complexity_score
    )

    # Length reduction (compression ratio) as an additional research metric
    orig_words = (text or "").split()
    trans_words = (result["transmuted_text"] or "").split()
    if orig_words:
        length_reduction = max(
            0.0, (len(orig_words) - len(trans_words)) / len(orig_words)
        )
    else:
        length_reduction = 0.0

    topic, lesson_title = _infer_topic_and_title(text, original_analysis)

    beanie_lesson_id: Optional[PydanticObjectId] = None
    beanie_student_id: Optional[PydanticObjectId] = None
    baseline_cognitive_load: Optional[str] = None
    if lesson_id:
        try:
            beanie_lesson_id = PydanticObjectId(lesson_id)
        except Exception:
            beanie_lesson_id = None
    if student_id:
        try:
            beanie_student_id = PydanticObjectId(student_id)
            # Fetch user to snapshot their baseline at this moment
            user = await User.get(beanie_student_id)
            if user:
                baseline_cognitive_load = user.baseline_cognitive_load
        except Exception:
            beanie_student_id = None
            baseline_cognitive_load = None

    doc = TransmutedContent(
        lesson_id=beanie_lesson_id,
        student_id=beanie_student_id,
        session_id=session_id,
        baseline_cognitive_load=baseline_cognitive_load,
        topic=topic,
        lesson_title=lesson_title,
        input={
            "raw_text": text,
            "cognitive_state": cognitive_state,
        },
        nlp_analysis={
            "flesch_kincaid_grade": original_analysis.flesch_kincaid_grade,
            "dependency_distance": original_analysis.dependency_distance,
            "complexity_score": original_analysis.complexity_score,
            "keywords_extracted": original_analysis.keywords,
        },
        output={
            "tier_applied": result["tier_applied"],
            "transmuted_text": result["transmuted_text"],
            "keywords_preserved": kept,
            "keywords_dropped": dropped,
        },
        quality={
            "keyword_preservation_rate": keyword_preservation_rate,
            "complexity_reduction": complexity_reduction,
            "length_reduction": length_reduction,
        },
    )
    await doc.insert()
    return result


