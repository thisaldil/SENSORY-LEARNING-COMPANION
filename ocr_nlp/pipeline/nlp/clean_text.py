import re

def clean(text):
    """
    Basic text cleaning for the NLP pipeline.
    """

    if not text:
        return {"cleaned_text": ""}

    # Step 1: Remove strange OCR artifacts
    text = re.sub(r"[^\w\s,.!?;:()\-']", " ", text)

    # Step 2: Normalize spaces
    text = re.sub(r"\s+", " ", text).strip()

    # Step 3: Fix spacing around punctuation
    text = re.sub(r"\s([?.!,;:])", r"\1", text)

    # Step 4: Lowercase for now (can disable later)
    text = text.lower()

    return {
        "cleaned_text": text
    }
