from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.config import settings
from app.models.schemas import AnalyzeResponse, Issue, ParsedDocument
from app.rate_limit import enforce_rate_limit
from app.services.ats_rules import check_text, sections_from_text
from app.services.parse import detect_kind, extract_text, preview

router = APIRouter()

STUB_NOTE = Issue(
    id="foundation-stub",
    category="structure",
    severity="info",
    message="This is the foundation analyzer: text extract plus deterministic ATS checks. Groq spelling and rewrite are wired but not called yet.",
    suggestion="Review the issues below, then download. Guided category edits come next.",
)


@router.post("/v1/analyze", response_model=AnalyzeResponse)
async def analyze(request: Request, file: UploadFile = File(...)) -> AnalyzeResponse:
    enforce_rate_limit(request)

    filename = file.filename or "resume"
    kind = detect_kind(filename, file.content_type)
    if kind is None:
        raise HTTPException(status_code=415, detail="Upload a PDF or DOCX file.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="The upload was empty.")
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File exceeds the 5 MB limit.")

    try:
        text = extract_text(data, kind)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read that file. Try another PDF or DOCX.") from None
    finally:
        del data

    issues = [STUB_NOTE, *check_text(text)]
    return AnalyzeResponse(
        parsed=ParsedDocument(filename=filename, textPreview=preview(text)),
        issues=issues,
        sections=sections_from_text(text),
    )
