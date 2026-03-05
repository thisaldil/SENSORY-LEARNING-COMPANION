from ocr_nlp.rag.chunker import load_corpus, chunk_text
from ocr_nlp.rag.embedder import generate_embeddings
from ocr_nlp.rag.vector_store import VectorStore

# Minimum cosine similarity to accept a chunk (0.0 – 1.0)
# Raise this to be stricter, lower it if you get no results
SCORE_THRESHOLD = 0.30


def build_vector_store(corpus_path):
    documents = load_corpus(corpus_path)
    all_chunks = []

    for doc in documents:
        chunks = chunk_text(doc["text"])
        all_chunks.extend(chunks)

    print(f"[Retriever] Total chunks indexed: {len(all_chunks)}")

    embeddings = generate_embeddings(all_chunks)

    dimension = len(embeddings[0])
    store = VectorStore(dimension)
    store.add(embeddings, all_chunks)

    return store


def retrieve_context(store, query, top_k=3):
    """
    Retrieve the most relevant chunks for the query.

    Fixes vs old version:
      - Uses cosine similarity scores (not L2 distance)
      - Filters out low-score chunks with SCORE_THRESHOLD
      - Re-ranks by score DESC, not by a True/False keyword check
      - Prints scores so you can debug which lesson is being used
    """

    query_embedding = generate_embeddings([query])[0]

    # Returns list of {"text": ..., "score": ...}  (top_k * 2 to allow filtering)
    raw_results = store.search(query_embedding, top_k=top_k * 2)

    print(f"\n[Retriever] Query: '{query}'")
    print(f"[Retriever] All scores:")
    for r in raw_results:
        preview = r["text"][:80].replace("\n", " ")
        print(f"   score={r['score']:.3f}  |  {preview}")

    # Filter by threshold, already sorted best-first by FAISS
    filtered = [r for r in raw_results if r["score"] >= SCORE_THRESHOLD]

    if not filtered:
        print(f"[Retriever] WARNING: No chunks above threshold {SCORE_THRESHOLD}. "
              f"Using top 1 fallback.")
        filtered = raw_results[:1]

    top_chunks = [r["text"] for r in filtered[:top_k]]

    print(f"[Retriever] Using {len(top_chunks)} chunk(s) for generation.")
    return top_chunks