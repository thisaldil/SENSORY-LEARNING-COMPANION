from ocr_nlp.rag.rag_service import run_rag
from ocr_nlp.pipeline.nlp.clean_text import clean
from ocr_nlp.pipeline.ocr.preprocess import preprocess_image
from ocr_nlp.pipeline.ocr.extract import extract_text


def format_rag_output(rag_output):
    """
    Ensure RAG output is always structured.
    """

    # If RAG returned a dictionary (expected case)
    if isinstance(rag_output, dict):
        return {
            "definition": rag_output.get("definition", ""),
            "example": rag_output.get("example", ""),
            "narration_script": rag_output.get("narration_script", "")
        }

    # If RAG returned plain text (fallback)
    return {
        "definition": rag_output,
        "example": "",
        "narration_script": ""
    }


def handle_text(text):

    cleaned = clean(text)
    query = cleaned["cleaned_text"]

    rag_output = run_rag(query)

    return {
        "extracted_text": text,
        "cleaned_text": query,
        "rag_output": format_rag_output(rag_output)
    }


def handle_image(image_bytes):

    processed_image = preprocess_image(image_bytes)
    raw_text = extract_text(processed_image)

    cleaned = clean(raw_text)
    query = cleaned["cleaned_text"]

    rag_output = run_rag(query)

    return {
        "extracted_text": raw_text,
        "cleaned_text": query,
        "rag_output": format_rag_output(rag_output)
    }