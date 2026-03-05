"""
Infer topic(s) and cognitive load from a lesson for filtering activities.
Uses subject and content so activities can be matched by topic and cognitive load.
"""
import re
from typing import List, Optional

from app.models.audio_haptics.lesson import Lesson


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
