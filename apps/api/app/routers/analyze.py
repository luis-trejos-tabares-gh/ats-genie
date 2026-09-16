from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.config import settings
from app.models.schemas import AnalyzeResponse, ParsedDocument, ResumeSections
from app.rate_limit import enforce_burst, groq_slot
from app.services.ats_rules import check_text
from app.services.groq_client import GroqError
from app.services.parse import detect_kind, extract_text, preview
from app.services.recommend import recommend_from_text

router = APIRouter()
ALLOWED_OUTPUT = {"keep", "en", "es", "pt", "de"}


@router.post("/v1/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: Request,
    file: UploadFile = File(...),
    outputLanguage: str = Form("keep"),
) -> AnalyzeResponse:
    enforce_burst(request)
    if outputLanguage not in ALLOWED_OUTPUT:
        raise HTTPException(status_code=400, detail="outputLanguage must be keep, en, es, pt, or de.")

    filename = file.filename or "resume"
    kind = detect_kind(filename, file.content_type)
    if kind is None:
        raise HTTPException(status_code=415, detail="Upload a PDF or DOCX file.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="The upload was empty.")
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File exceeds the 3 MB limit.")

    try:
        text = extract_text(data, kind)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read that file. Try another PDF or DOCX.") from None
    finally:
        del data

    deterministic = check_text(text)
    if not text.strip():
        return AnalyzeResponse(
            parsed=ParsedDocument(filename=filename, textPreview=preview(text), truncated=False),
            issues=deterministic,
            sections=ResumeSections(),
        )

    try:
        with groq_slot(request):
            detected, resolved, issues, sections, truncated = recommend_from_text(
                text,
                outputLanguage,
                deterministic,
            )
    except GroqError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    return AnalyzeResponse(
        parsed=ParsedDocument(filename=filename, textPreview=preview(text), truncated=truncated),
        issues=issues,
        sections=sections,
        detectedLanguage=detected,
        outputLanguage=resolved,
    )
