from fastapi import APIRouter, Request
from fastapi.responses import Response

from app.models.schemas import GenerateRequest
from app.rate_limit import enforce_rate_limit
from app.services.documents import render

router = APIRouter()


@router.post("/v1/generate")
async def generate(request: Request, payload: GenerateRequest) -> Response:
    enforce_rate_limit(request)
    body, media_type, filename = render(payload.sections, payload.format)
    return Response(
        content=body,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )
