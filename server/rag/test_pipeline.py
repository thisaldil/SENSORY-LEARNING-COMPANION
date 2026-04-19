from chunker import load_corpus, chunk_text
from embedder import generate_embeddings
from vector_store import VectorStore


CORPUS_PATH = "corpus"


def main():
    print("Loading corpus...")
    documents = load_corpus(CORPUS_PATH)

    print("Chunking documents...")
    all_chunks = []

    for doc in documents:
        lesson_name = doc["lesson"]
        chunks = chunk_text(doc["text"])

        for chunk in chunks:
            all_chunks.append({
                "lesson": lesson_name,
                "content": chunk
            })

    print(f"Total chunks created: {len(all_chunks)}")

    print("Embedding chunks...")
    chunk_texts = [chunk["content"] for chunk in all_chunks]
    embeddings = generate_embeddings(chunk_texts)

    dimension = embeddings.shape[1]

    print("Initializing vector store...")
    store = VectorStore(dimension)

    print("Adding embeddings to store...")
    store.add(embeddings, all_chunks)

    print("\nRunning test query...\n")
    query = "Explain food chain"

    query_embedding = generate_embeddings([query])[0]

    retrieved_chunks = store.search(query_embedding, top_k=6)

    print("Retrieved Structured Sections:\n")

    final_answer_blocks = []

    for i, item in enumerate(retrieved_chunks):
        print(f"--- Section {i+1} ---\n")
        print(item["content"])
        print("\n")
        final_answer_blocks.append(item["content"])

    print("====================================")
    print("FINAL ANSWER (Structured Output)")
    print("====================================\n")

    final_answer = "\n\n".join(final_answer_blocks)
    print(final_answer)


if __name__ == "__main__":
    main()