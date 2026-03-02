from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME = "google/flan-t5-base"

print("Loading local LLM model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
print("Model loaded.")


def generate_response(query, context_chunks):
    """
    Generate structured educational response.
    """

    # Join retrieved chunks into context
    context = "\n\n".join(context_chunks)

    prompt = f"""
You are a Grade 6 Science teacher.

Use ONLY the provided context to answer the question.

Context:
{context}

Question:
{query}

Answer strictly in this exact format:

Definition: <one clear paragraph>

Example: <one simple real-world example>

Narration: <short storytelling explanation for children>
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
            do_sample=False
        )

    response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("RAW MODEL OUTPUT:")
    print(response_text)

    # Structured parsing
    definition = ""
    example = ""
    narration = ""

    if "Definition:" in response_text:
        definition = response_text.split("Definition:")[1].split("Example:")[0].strip()

    if "Example:" in response_text:
        example = response_text.split("Example:")[1].split("Narration:")[0].strip()

    if "Narration:" in response_text:
        narration = response_text.split("Narration:")[1].strip()

    return {
        "definition": definition,
        "example": example,
        "narration_script": narration
    }