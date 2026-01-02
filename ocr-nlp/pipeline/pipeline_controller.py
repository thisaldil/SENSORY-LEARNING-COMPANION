import os
import json

from pipeline.nlp.clean_text import clean
from pipeline.ocr.preprocess import preprocess_image
from pipeline.ocr.extract import extract_text
from pipeline.nlp.concept_extraction import extract_concepts
from pipeline.nlp.relation_extraction import extract_relations
from pipeline.graph.scene_graph import build_scene_graph
from pipeline.nlp.example_mapping import map_examples
from pipeline.narration.script_generator import generate_script



def handle_text(text):
    """
    Process text input: clean and extract concepts
    """
    cleaned = clean(text)
    concepts = extract_concepts(cleaned["cleaned_text"])
    relations = extract_relations(cleaned["cleaned_text"])
    graph = build_scene_graph(concepts, relations)
    examples = map_examples(concepts)
    narration = generate_script(relations, examples)

    # DO NOT LOAD MOCK FOR TEXT INPUT
    output = {
        "extracted_text": cleaned["cleaned_text"],
        "cleaned_text": cleaned["cleaned_text"],
        "concepts": concepts,
        "relations": relations,
        "scene_graph": graph,
        "examples": examples,
        "narration": narration,
        "example_mapping": examples,  
        "narration_script": narration 
    }

    return output



def handle_image(image_bytes):
    processed_image = preprocess_image(image_bytes)
    raw_text = extract_text(processed_image)
    cleaned = clean(raw_text)

    concepts = extract_concepts(cleaned["cleaned_text"])
    relations = extract_relations(cleaned["cleaned_text"])
    graph = build_scene_graph(concepts, relations)
    examples = map_examples(concepts)
    narration = generate_script(relations, examples)

    output = {
        "extracted_text": cleaned["cleaned_text"],
        "cleaned_text": cleaned["cleaned_text"],
        "concepts": concepts,
        "relations": relations,
        "scene_graph": graph,
        "examples": examples,
        "narration": narration,
        "example_mapping": examples,  
        "narration_script": narration 
    }

    return output
