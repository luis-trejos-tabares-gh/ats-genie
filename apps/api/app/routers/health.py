from fastapi import APIRouter

from app.models.schemas import HealthResponse
from app.services.groq_client import get_model, groq_configured

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", groqConfigured=groq_configured(), model=get_model())
