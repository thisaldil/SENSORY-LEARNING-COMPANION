import os
import json
from pipeline.nlp.clean_text import clean
from pipeline.ocr.preprocess import preprocess_image
MOCK_PATH = os.path.join(os.path.dirname(__file__), "../api/mock_output.json")

def load_mock():
    with open(MOCK_PATH, "r") as f:
        return json.load(f)

def handle_text(text):
    cleaned = clean(text)

    output = load_mock()
    output["cleaned_text"] = cleaned["cleaned_text"]

    return output
def handle_image(image_bytes=None):
    # Step 1: preprocess image
    # processed = preprocess_image(image_bytes)
    #
    # Step 2: (later) OCR extraction
    #
    # For now:
    return load_mock()