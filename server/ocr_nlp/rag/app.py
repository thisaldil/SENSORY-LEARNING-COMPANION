from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from chunker import load_corpus, chunk_text
from embedder import generate_embeddings
from vector_store import VectorStore

# ---------- Initialize RAG once at startup ----------

CORPUS_PATH = "corpus"

documents = load_corpus(CORPUS_PATH)

all_chunks = []

for doc in documents:
    lesson_name = doc["lesson"]
    chunks = chunk_text(doc["text"])

    for chunk in chunks:
        all_chunks.append({
            "lesson": lesson_name,
            "content": chunk
        })

chunk_texts = [chunk["content"] for chunk in all_chunks]
embeddings = generate_embeddings(chunk_texts)

dimension = embeddings.shape[1]
store = VectorStore(dimension)
store.add(embeddings, all_chunks)

print("RAG system initialized.")


# ---------- FastAPI ----------

app = FastAPI()


class QueryRequest(BaseModel):
    question: str


@app.post("/ask")
def ask_question(request: QueryRequest):
    query_embedding = generate_embeddings([request.question])[0]
    retrieved_chunks = store.search(query_embedding, top_k=6)

    results = [item["content"] for item in retrieved_chunks]

    return {"answer_sections": results}


@app.get("/", response_class=HTMLResponse)
def homepage():
    return """
    <html>
        <head>
            <title>Educational RAG System</title>
        </head>
        <body>
            <h2>Grade 6 Science RAG System</h2>
            <textarea id="question" rows="4" cols="60"
                placeholder="Type your question here..."></textarea><br><br>
            <button onclick="ask()">Ask</button>
            <pre id="output"></pre>

            <script>
                async function ask() {
                    const question = document.getElementById("question").value;

                    const response = await fetch("/ask", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({question})
                    });

                    const data = await response.json();
                    document.getElementById("output").textContent =
                        data.answer_sections.join("\\n\\n");
                }
            </script>
        </body>
    </html>
    """