import os
import json
from pipeline.nlp.clean_text import clean

MOCK_PATH = os.path.join(os.path.dirname(__file__), "../api/mock_output.json")

def load_mock():
    with open(MOCK_PATH, "r") as f:
        return json.load(f)

def handle_text(text):
    cleaned = clean(text)

    output = load_mock()
    output["cleaned_text"] = cleaned["cleaned_text"]

    return output

def handle_image():
    # For now just return mock
    return load_mock()
