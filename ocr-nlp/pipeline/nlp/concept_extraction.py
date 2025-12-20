import spacy

# Transformer-based NLP
nlp = spacy.load("en_core_web_trf")

def extract_concepts(text):
    """
    Transformer-based concept extraction
    Uses semantic understanding instead of simple POS rules
    """
    doc = nlp(text)

    concepts = set()

    for chunk in doc.noun_chunks:
        # Remove very short or meaningless chunks
        if len(chunk.text) > 2:
            concepts.add(chunk.text.lower())

    return list(concepts)
