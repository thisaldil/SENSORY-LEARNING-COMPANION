import re
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


def chunk_text(text):
    """
    Semantic chunking based on SECTION markers.
    Each SECTION becomes one chunk.
    """

    pattern = r"(SECTION:.*?)(?=SECTION:|\Z)"
    matches = re.findall(pattern, text, re.DOTALL)

    chunks = []

    for block in matches:
        cleaned = block.strip()
        if len(cleaned) > 100:
            chunks.append(cleaned)

    return chunks