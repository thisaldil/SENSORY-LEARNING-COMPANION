import faiss
import numpy as np


class VectorStore:
    def __init__(self, dimension):
        # IndexFlatIP = Inner Product (cosine similarity when vectors are normalised)
        # This is better than L2 for semantic text search
        self.index = faiss.IndexFlatIP(dimension)
        self.text_chunks = []

    def add(self, embeddings, texts):
        vectors = np.array(embeddings, dtype=np.float32)

        # L2-normalise so inner product == cosine similarity
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        vectors = vectors / (norms + 1e-9)

        self.index.add(vectors)
        self.text_chunks.extend(texts)

    def search(self, query_embedding, top_k=5):
        query = np.array([query_embedding], dtype=np.float32)

        # Normalise query too
        query = query / (np.linalg.norm(query) + 1e-9)

        scores, indices = self.index.search(query, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append({
                "text":  self.text_chunks[idx],
                "score": float(score)       # cosine similarity: 0.0 – 1.0
            })

        return results