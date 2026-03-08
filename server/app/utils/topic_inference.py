"""
Infer topic(s), keywords, and cognitive load from a lesson for filtering activities.
Uses subject and content so activities can be matched by topic, keywords, and cognitive load.
"""
import re
from typing import List, Optional, Set

from app.models.audio_haptics.lesson import Lesson

# Common stopwords to exclude from keyword extraction
_STOPWORDS: Set[str] = {
    "the", "a", "an", "this", "that", "with", "from", "when", "what", "where",
    "which", "there", "their", "these", "those", "have", "has", "had", "will",
    "would", "could", "should", "more", "most", "very", "also", "just", "only",
    "about", "some", "such", "into", "through", "during", "before", "after",
    "above", "below", "between", "under", "again", "each", "other", "being",
    "been", "both", "same", "and", "or", "but", "for", "nor", "so", "yet",
    "is", "are", "was", "were", "be", "been", "being", "to", "of", "in", "on",
    "at", "by", "as", "it", "its",
}


def extract_keywords_from_lesson(lesson: Lesson, min_length: int = 3) -> List[str]:
    """
    Extract significant keywords from lesson subject and content for activity matching.

    Keywords are used to match activities whose topic or title contains any of these
    words (e.g. "magnetic", "field", "electromagnetism" for a magnetic lesson).
    This allows "A Magnetic Field" lesson to match "Magnetic Field" or "Electromagnetism"
    activities even when topic strings differ.

    Returns:
        List of lowercase keywords (min length, no stopwords).
    """
    keywords: Set[str] = set()
    text_parts: List[str] = []

    if lesson.subject and lesson.subject.strip():
        text_parts.append(lesson.subject.strip())
    if lesson.title and lesson.title.strip():
        text_parts.append(lesson.title.strip())
    if lesson.content and lesson.content.strip():
        text_parts.append(lesson.content.strip())

    for text in text_parts:
        words = re.findall(r"[A-Za-z]+", text)
        for w in words:
            lower = w.lower()
            if (
                len(lower) >= min_length
                and lower not in _STOPWORDS
                and not lower.isdigit()
            ):
                keywords.add(lower)

    return sorted(keywords)


def infer_cognitive_load_from_lesson(lesson: Lesson) -> Optional[str]:
    """
    Infer a suggested cognitive load (LOW, MEDIUM, HIGH) from lesson content.

    Uses simple heuristics: content length, sentence length, and word complexity
    to suggest which activities (by cognitive_load) fit the lesson.

    Returns:
        "LOW", "MEDIUM", or "HIGH", or None if content is empty.
    """
    if not lesson.content or not lesson.content.strip():
        return None
    text = lesson.content.strip()
    word_count = len(re.findall(r"\S+", text))
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    avg_sentence_length = (sum(len(re.findall(r"\S+", s)) for s in sentences) / len(sentences)) if sentences else 0
    # Heuristic: short + short sentences = LOW; long or complex sentences = MEDIUM/HIGH
    if word_count < 80 and avg_sentence_length < 15:
        return "LOW"
    if word_count > 250 or avg_sentence_length > 22:
        return "HIGH"
    return "MEDIUM"


def infer_topics_from_lesson(lesson: Lesson) -> List[str]:
    """
    Infer a list of topic strings from a lesson for activity filtering.

    - Always includes the lesson's subject (e.g. "Science").
    - Tries to derive a primary topic from content (e.g. first sentence → "Water Cycle").

    Returns:
        List of topic strings (e.g. ["Science", "Water Cycle"]) to match against activity.topic.
    """
    topics: List[str] = []

    if lesson.subject and lesson.subject.strip():
        topics.append(lesson.subject.strip())

    if not lesson.content or not lesson.content.strip():
        return topics

    content = lesson.content.strip()
    # First sentence (up to first . ! ?)
    first_sentence_match = re.search(r"^[\s\S]*?[.!?]\s*", content)
    if first_sentence_match:
        first = first_sentence_match.group(0).strip()
    else:
        first = content[:200].strip()

    # Drop leading "The ", "A ", "An " and take first phrase
    cleaned = re.sub(r"^(The|A|An)\s+", "", first, flags=re.I).strip()
    words = re.findall(r"[A-Za-z]+", cleaned)[:6]
    if words:
        phrase = " ".join(w.capitalize() for w in words)
        if phrase and phrase not in topics:
            topics.append(phrase)

    # "X is the..." pattern (e.g. "Water cycle is the continuous...")
    def_match = re.search(r"^([A-Za-z][A-Za-z\s]{2,40}?)\s+is\s+(?:the|a|an)\s+", first, re.I)
    if def_match:
        subject_phrase = def_match.group(1).strip().title()
        if subject_phrase and subject_phrase not in topics:
            topics.append(subject_phrase)

    return topics
