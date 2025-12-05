from fastapi import FastAPI
from api.app import router

app = FastAPI()

app.include_router(router)
