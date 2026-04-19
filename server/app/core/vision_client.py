import os

from google.cloud import vision

# Vision client uses its own env var so it doesn't clash with
# Text‑to‑Speech credentials:
#   VISION_GOOGLE_APPLICATION_CREDENTIALS="/secure/path/vision-credentials.json"
# If that is not set, it will fall back to the default Google ADC chain
# (including GOOGLE_APPLICATION_CREDENTIALS if present).


def _create_vision_client() -> vision.ImageAnnotatorClient:
    creds_path = os.getenv("VISION_GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if creds_path and os.path.isfile(creds_path):
        return vision.ImageAnnotatorClient.from_service_account_file(creds_path)
    return vision.ImageAnnotatorClient()


vision_client = _create_vision_client()

