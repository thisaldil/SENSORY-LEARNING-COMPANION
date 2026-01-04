import spacy

nlp = spacy.load("en_core_web_sm")

def extract_relations(text):
    """
    Extract simple subject–verb–object relations
    """
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
