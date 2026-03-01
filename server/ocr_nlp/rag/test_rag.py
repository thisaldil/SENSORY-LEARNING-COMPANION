import os
import json
from ocr_nlp.rag.retriever import build_vector_store, retrieve_context
from ocr_nlp.rag.generator import generate_response

CORPUS_PATH = os.path.join(
    os.path.dirname(__file__),
    "corpus"
)

print("Building vector store...")
store = build_vector_store(CORPUS_PATH)
print("RAG system ready.")

while True:
    query = input("\nEnter question (or type 'exit'): ")
    if query.lower() == "exit":
        break

    # Retrieve relevant curriculum chunks
    context = retrieve_context(store, query)[:2]
    context = [chunk[:800] for chunk in context]

    print("\nRetrieved Context:")
    for i, chunk in enumerate(context, 1):
        print(f"\n--- Chunk {i} ---")
        print(chunk[:300])

    print("\nGenerating Structured JSON Answer...")

    rag_output = generate_response(query, context)

    print("\n===== Structured JSON Output =====\n")
    print(json.dumps(rag_output, indent=2))