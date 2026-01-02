import spacy

nlp = spacy.load("en_core_web_sm")

STOP_WORDS = {
    "what", "how", "why", "is", "are", "was", "were",
    "does", "do", "did", "the", "a", "an", "and", "or",
    "of", "to", "in", "on", "for", "with", "works", "explain"
}


def extract_concepts(text):
    """
    Extract candidate concepts from text using spaCy.
    Curriculum validation is handled later by the knowledge base.
    """

    doc = nlp(text.lower())
    concepts = set()

    for chunk in doc.noun_chunks:
        chunk_text = chunk.text.strip().lower()

        # Remove stop words
        if chunk_text in STOP_WORDS:
            continue

        # Remove very short or meaningless chunks
        if len(chunk_text) < 3:
            continue

        concepts.add(chunk_text)

    return list(concepts)
