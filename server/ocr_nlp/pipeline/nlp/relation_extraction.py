from functools import lru_cache


@lru_cache(maxsize=1)
def _get_nlp():
    import spacy

    try:
        return spacy.load("en_core_web_sm")
    except OSError as exc:
        raise RuntimeError(
            "SpaCy model 'en_core_web_sm' is not installed. "
            "Run: python -m spacy download en_core_web_sm"
        ) from exc

def extract_relations(text):
    """
    Extract simple subject–verb–object relations
    """
    nlp = _get_nlp()
    doc = nlp(text)
    relations = []

    for sent in doc.sents:
        subject = None
        verb = None
        obj = None

        for token in sent:
            if token.dep_ in ("nsubj", "nsubjpass"):
                subject = token.text
                verb = token.head.text

            if token.dep_ in ("dobj", "pobj"):
                obj = token.text

        if subject and verb and obj:
            relations.append({
                "subject": subject,
                "relation": verb,
                "object": obj
            })

    return relations
