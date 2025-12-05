from fastapi import APIRouter
import json
import os

router = APIRouter()

MOCK_PATH = os.path.join(os.path.dirname(__file__), "mock_output.json")

def load_mock():
    with open(MOCK_PATH, "r") as f:
        return json.load(f)

@router.post("/process-text")
def process_text():
    return load_mock()

@router.post("/process-image")
def process_image():
    return load_mock()
