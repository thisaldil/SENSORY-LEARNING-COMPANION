from .retriever import build_vector_store, retrieve_context
from .generator import generate_response


# Build vector store once at startup
vector_store = build_vector_store("ocr_nlp/rag/corpus")


def run_rag(query: str) -> dict:
    """
    Run the full RAG pipeline.
    Returns a structured dict: { definition, example, narration_script }
    """
    context_chunks = retrieve_context(vector_store, query)

    print("QUERY:", query)
    print("RETRIEVED CHUNKS:", context_chunks)

    result = generate_response(query, context_chunks)

    print("FINAL RAG RESULT:", result)

    return result  # Always a dict now