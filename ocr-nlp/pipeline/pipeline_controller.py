import os
import json
from pipeline.nlp.clean_text import clean
from pipeline.ocr.preprocess import preprocess_image
from pipeline.ocr.extract import extract_text
from pipeline.nlp.concept_extraction import extract_concepts
from pipeline.nlp.relation_extraction import extract_relations


MOCK_PATH = os.path.join(os.path.dirname(__file__), "../api/mock_output.json")

def load_mock():
    with open(MOCK_PATH, "r") as f:
        return json.load(f)

def handle_text(text):
    """
    Process text input: clean and extract concepts
    """
    cleaned = clean(text)
    concepts = extract_concepts(cleaned["cleaned_text"])
    relations = extract_relations(cleaned["cleaned_text"])

    output = load_mock()
    output["cleaned_text"] = cleaned["cleaned_text"]
    output["concepts"] = concepts
    output["relations"] = relations

    return output

def handle_image(image_bytes):
    """
    Process image input: preprocess, OCR, clean, and extract concepts
    """
    # Preprocess image
    processed_image = preprocess_image(image_bytes)

    # Extract text using OCR
    raw_text = extract_text(processed_image)

    # Clean extracted text
    cleaned = clean(raw_text)
    
    # Extract concepts from cleaned text
    concepts = extract_concepts(cleaned["cleaned_text"])
    relations = extract_relations(cleaned["cleaned_text"])

    # Prepare output
    output = load_mock()
    output["extracted_text"] = cleaned["cleaned_text"]
    output["concepts"] = concepts
    output["relations"] = relations

    return output