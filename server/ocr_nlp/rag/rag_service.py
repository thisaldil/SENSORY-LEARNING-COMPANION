from .retriever import build_vector_store, retrieve_context
from .generator import generate_response


# Build vector store once
vector_store = build_vector_store("ocr_nlp/rag/corpus")


def run_rag(query):

    context_chunks = retrieve_context(vector_store, query)

    print("QUERY:", query)
    print("RETRIEVED CHUNKS:", context_chunks)

    result = generate_response(query, context_chunks)

    print("GENERATOR OUTPUT:", result)

    return result