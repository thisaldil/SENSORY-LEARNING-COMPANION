from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME = "google/flan-t5-base"

print("Loading local LLM model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
print("Model loaded.")

def generate_response(query, context_chunks):
    """
    Generate structured educational response
    using retrieved curriculum context.
    """

    context = "\n\n".join(context_chunks)

    prompt = f"""
You are an educational assistant for Grade 6 Science students.

Use ONLY the context provided below to answer the question.
Explain in simple language.
Provide:
- Definition
- Simple Example
- Short Narration Script (2-3 sentences)

Context:
{context}

Question:
{query}

Answer:
"""

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=1024
    )

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=250,
            temperature=0.3
        )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return response