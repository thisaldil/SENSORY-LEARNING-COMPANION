from ocr_nlp.rag.chunker import load_corpus, chunk_text
from ocr_nlp.rag.embedder import generate_embeddings
from ocr_nlp.rag.vector_store import VectorStore


def build_vector_store(corpus_path):
    documents = load_corpus(corpus_path)
    all_chunks = []

    for doc in documents:
        chunks = chunk_text(doc["text"])
        all_chunks.extend(chunks)

    embeddings = generate_embeddings(all_chunks)

    dimension = len(embeddings[0])
    store = VectorStore(dimension)
    store.add(embeddings, all_chunks)

    return store


def retrieve_context(store, query):

    query_embedding = generate_embeddings([query])[0]

    results = store.search(query_embedding, top_k=5)

    query_lower = query.lower()

    # prioritize chunks containing concept name
    ranked = sorted(
        results,
        key=lambda chunk: query_lower in chunk.lower(),
        reverse=True
    )

    return ranked[:3]