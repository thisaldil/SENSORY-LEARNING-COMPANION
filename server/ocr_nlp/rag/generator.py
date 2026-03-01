import json
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
    and safely convert into JSON format.
    """

    context = "\n\n".join(context_chunks)

    prompt = f"""
You are a Grade 6 Science teacher.

Explain the following question in simple language
using only the information provided.

Context:
{context}

Question:
{query}

Write clearly in this format:

Definition:
Example:
Narration:
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

    # Manual parsing instead of strict JSON parsing
    definition = ""
    example = ""
    narration = ""

    try:
        parts = response_text.split("Example:")
        if len(parts) > 1:
            definition_part = parts[0].replace("Definition:", "").strip()
            example_part = parts[1].split("Narration:")[0].strip()
            narration_part = parts[1].split("Narration:")[1].strip()

            definition = definition_part
            example = example_part
            narration = narration_part
    except:
        definition = response_text

    return {
        "definition": definition,
        "example": example,
        "narration_script": narration
    }