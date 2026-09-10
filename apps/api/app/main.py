from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import analyze, assemble, generate, health

app = FastAPI(
    title="ATS Assistant API",
    version="0.1.0",
    description="Stateless resume analyze / assemble / generate. No persistence.",
)

origins = [origin.strip() for origin in settings.allowed_origin.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(assemble.router)
app.include_router(generate.router)
