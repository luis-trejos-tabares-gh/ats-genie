from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import AssembleRequest, AssembleResponse
from app.rate_limit import enforce_burst, groq_slot
from app.services.groq_client import GroqError
from app.services.recommend import recommend_from_sections

router = APIRouter()


@router.post("/v1/assemble", response_model=AssembleResponse)
async def assemble(request: Request, payload: AssembleRequest) -> AssembleResponse:
    enforce_burst(request)
    try:
        with groq_slot(request):
            detected, resolved, notes, recommendation, _truncated = recommend_from_sections(
                payload.sections,
                payload.outputLanguage,
            )
    except GroqError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    return AssembleResponse(
        recommendation=recommendation,
        notes=notes,
        detectedLanguage=detected,
        outputLanguage=resolved,
    )
