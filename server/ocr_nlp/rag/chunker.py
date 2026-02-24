import os
from pathlib import Path

def load_corpus(corpus_path):
    documents = []
    for file in Path(corpus_path).glob("*.txt"):
        with open(file, "r", encoding="utf-8") as f:
            text = f.read()
            documents.append({
                "lesson": file.stem,
                "text": text
            })
    return documents


def chunk_text(text, chunk_size=400, overlap=50):
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if len(chunk) > 50:
            chunks.append(chunk)

    return chunks