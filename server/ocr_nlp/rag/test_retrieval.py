import os
from ocr_nlp.rag.retriever import build_vector_store, retrieve_context

# Path to your corpus folder
CORPUS_PATH = os.path.join(
    os.path.dirname(__file__),
    "corpus"
)

print("Building vector store...")
store = build_vector_store(CORPUS_PATH)
print("Vector store ready.")

while True:
    query = input("\nEnter query (or type 'exit'): ")
    if query.lower() == "exit":
        break

    results = retrieve_context(store, query)

    print("\nTop Retrieved Chunks:")
    for i, chunk in enumerate(results, 1):
        print(f"\n--- Result {i} ---")
        print(chunk[:500])