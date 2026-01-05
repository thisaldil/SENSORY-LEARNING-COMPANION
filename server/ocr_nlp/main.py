from fastapi import FastAPI
from ocr_nlp.api.app import router

app = FastAPI()

app.include_router(router)
