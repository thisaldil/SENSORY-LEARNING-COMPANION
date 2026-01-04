import os
import json


def load_example_db():
    """
    Load the JSON knowledge base for examples
    """
    base_dir = os.path.dirname(__file__)
    db_path = os.path.join(base_dir, "example_db.json")

    with open(db_path, "r", encoding="utf-8") as f:
        return json.load(f)


def map_examples(concepts):
    db = load_example_db()
    concept_db = db.get("concepts", {})

    mapped = {}

    for concept in concepts:
        key = concept.lower()
        if key in concept_db:
            mapped[key] = {
                "definition": concept_db[key]["definition"],
                "examples": concept_db[key]["examples"],
                "lesson": concept_db[key]["lesson"]
            }

    return mapped
