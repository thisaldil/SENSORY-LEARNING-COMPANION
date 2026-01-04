from ocr_nlp.speech.speech_to_text import speech_to_text
from ocr_nlp.pipeline.nlp.clean_text import clean
from ocr_nlp.pipeline.nlp.concept_extraction import extract_concepts
from ocr_nlp.pipeline.nlp.relation_extraction import extract_relations
from ocr_nlp.pipeline.graph.scene_graph import build_scene_graph
from ocr_nlp.pipeline.nlp.example_mapping import map_examples
from ocr_nlp.pipeline.narration.script_generator import generate_script


def handle_voice(audio_bytes):
    """
    Voice → text → full NLP pipeline
    """

    raw_text = speech_to_text(audio_bytes)
    cleaned = clean(raw_text)

    text = cleaned["cleaned_text"]

    concepts = extract_concepts(text)
    relations = extract_relations(text)
    graph = build_scene_graph(concepts, relations)
    examples = map_examples(concepts)
    narration = generate_script(relations, examples)

    return {
        "extracted_text": text,
        "cleaned_text": text,
        "concepts": concepts,
        "relations": relations,
        "scene_graph": graph,
        "examples": examples,
        "narration": narration
    }
