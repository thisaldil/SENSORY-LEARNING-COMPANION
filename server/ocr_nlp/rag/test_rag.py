import os
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

    context = retrieve_context(store, query)

    print("\nRetrieved Context:")
    for i, chunk in enumerate(context, 1):
        print(f"\n--- Chunk {i} ---")
        print(chunk[:300])

    print("\nGenerating Answer...")
    answer = generate_response(query, context)

    print("\n===== Final Answer =====\n")
    print(answer)