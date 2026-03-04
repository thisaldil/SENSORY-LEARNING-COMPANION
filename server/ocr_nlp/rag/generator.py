from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME = "google/flan-t5-base"

print("Loading local LLM model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
print("Model loaded.")


def generate_response(query, context_chunks):
    """
    Generate explanation script using retrieved chunks.
    """

    context = "\n\n".join(context_chunks)

    prompt = f"""
You are a Grade 6 science teacher.

Use the context to explain the concept clearly to a student.

Context:
{context}

Question:
{query}

Explain the concept clearly and simply.
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
            max_new_tokens=200,
            do_sample=False
        )

    response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("RAW MODEL OUTPUT:")
    print(response_text)

    return response_text