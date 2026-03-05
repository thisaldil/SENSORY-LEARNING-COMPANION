"""
generator.py

Uses Google Gemini API instead of flan-t5-base.
Gemini is called ONCE with a structured prompt → returns all 3 fields reliably.

Requirements:
    pip install google-generativeai

Environment variable:
    GOOGLE_API_KEY=your_key_here
    (set in your .env file or system environment)
"""

import os
import re
import json
import google.generativeai as genai

# ── Configure Gemini ──────────────────────────────────────────────────────────
_api_key = os.getenv("GOOGLE_API_KEY")
if not _api_key:
    raise EnvironmentError(
        "GOOGLE_API_KEY is not set. "
        "Add it to your .env file: GOOGLE_API_KEY=your_key_here"
    )

genai.configure(api_key=_api_key)
_gemini = genai.GenerativeModel("gemini-1.5-flash")   # fast + free tier

print("[Generator] Gemini API ready.")


# ── JSON parser ───────────────────────────────────────────────────────────────

def _parse_json_response(text: str) -> dict:
    """
    Extract JSON from Gemini response.
    Handles cases where the model wraps output in ```json ... ``` fences.
    """
    # Strip markdown code fences if present
    clean = re.sub(r"```json|```", "", text).strip()

    try:
        parsed = json.loads(clean)
        return {
            "definition":       parsed.get("definition", "").strip(),
            "example":          parsed.get("example", "").strip(),
            "narration_script": parsed.get("narration_script", "").strip()
        }
    except json.JSONDecodeError:
        # Fallback: try to extract fields manually with regex
        def _grab(field):
            m = re.search(rf'"{field}"\s*:\s*"(.*?)"(?=\s*[,}}])', clean, re.DOTALL)
            return m.group(1).strip() if m else ""

        return {
            "definition":       _grab("definition"),
            "example":          _grab("example"),
            "narration_script": _grab("narration_script")
        }


# ── Main generator ────────────────────────────────────────────────────────────

def generate_response(query: str, context_chunks: list) -> dict:
    """
    Call Gemini once with all context chunks and get back a structured
    { definition, example, narration_script } dict.
    """
    if not context_chunks:
        return {"definition": "", "example": "", "narration_script": ""}

    context = "\n\n---\n\n".join(context_chunks)

    prompt = f"""You are a Grade 6 science teacher in Sri Lanka.

A student asked: "{query}"

Use ONLY the lesson content below to answer. Do not add outside knowledge.

LESSON CONTENT:
{context}

Respond with a JSON object using exactly these 3 keys:

{{
  "definition": "A clear, simple 2-sentence definition suitable for an 11-year-old student.",
  "example": "One specific real-life example from the lesson (Sri Lankan context preferred). 1-2 sentences.",
  "narration_script": "A friendly 3-4 sentence script a teacher would say out loud to the class. Start with Imagine, Think about, or Did you know."
}}

Return only the JSON object. No extra text, no markdown fences."""

    print(f"[Generator] Calling Gemini for query: '{query}'")

    try:
        response = _gemini.generate_content(prompt)
        raw_text = response.text
        print(f"[Generator] Raw response:\n{raw_text}\n")

        result = _parse_json_response(raw_text)

    except Exception as e:
        print(f"[Generator] Gemini API error: {e}")
        result = {
            "definition":       "",
            "example":          "",
            "narration_script": ""
        }

    # Safety: ensure no field is None
    result = {k: v or "" for k, v in result.items()}

    print("\n===== RAG OUTPUT =====")
    for k, v in result.items():
        print(f"  {k}:\n    {v}\n")
    print("======================\n")

    return result