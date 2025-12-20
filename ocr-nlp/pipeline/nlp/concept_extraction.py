import spacy

nlp = spacy.load("en_core_web_sm")

def extract_concepts(text):
    doc = nlp(text)
    concepts = list(set([token.text for token in doc if token.pos_ in ("NOUN", "PROPN")]))
    return concepts
