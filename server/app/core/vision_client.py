import os

from google.cloud import vision
from google.auth.exceptions import DefaultCredentialsError

# Vision client uses its own env var so it doesn't clash with
# Text‑to‑Speech credentials:
#   VISION_GOOGLE_APPLICATION_CREDENTIALS="/secure/path/vision-credentials.json"
# If that is not set, it will fall back to the default Google ADC chain
# (including GOOGLE_APPLICATION_CREDENTIALS if present).


_vision_client: vision.ImageAnnotatorClient | None = None
_vision_client_error: str | None = None


def _create_vision_client() -> vision.ImageAnnotatorClient:
    creds_path = os.getenv("VISION_GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if creds_path and os.path.isfile(creds_path):
        return vision.ImageAnnotatorClient.from_service_account_file(creds_path)
    return vision.ImageAnnotatorClient()


def get_vision_client() -> vision.ImageAnnotatorClient | None:
    """
    Lazily create the Google Vision client.

    Render (and other PaaS) commonly run without Application Default Credentials (ADC).
    Import-time initialization would crash the whole app; instead we return None and
    let API routes respond with a clear 503 error.
    """
    global _vision_client, _vision_client_error
    if _vision_client is not None:
        return _vision_client
    if _vision_client_error is not None:
        return None
    try:
        _vision_client = _create_vision_client()
        return _vision_client
    except DefaultCredentialsError as exc:
        _vision_client_error = str(exc)
        return None
    except Exception as exc:
        _vision_client_error = str(exc)
        return None


def get_vision_client_error() -> str | None:
    """Return last initialization error message if Vision client failed to init."""
    return _vision_client_error

