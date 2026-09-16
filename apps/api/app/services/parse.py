import logging
from io import BytesIO

from docx import Document
from pdfminer.high_level import extract_text as pdfminer_extract
from pypdf import PdfReader

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}
ALLOWED_EXTENSIONS = {".pdf": "pdf", ".docx": "docx"}
PREVIEW_CHARS = 4000
MIN_USEFUL_CHARS = 40

# pypdf.logger_warning() logs on child loggers like pypdf._reader, not "pypdf".
logging.getLogger("pypdf").setLevel(logging.ERROR)


def detect_kind(filename: str, content_type: str | None) -> str | None:
    lower = filename.lower()
    for suffix, kind in ALLOWED_EXTENSIONS.items():
        if lower.endswith(suffix):
            return kind
    if content_type in ALLOWED_TYPES:
        return ALLOWED_TYPES[content_type]
    return None


def _pypdf_text(data: bytes) -> str:
    reader = PdfReader(BytesIO(data), strict=False)
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


def _pdfminer_text(data: bytes) -> str:
    return (pdfminer_extract(BytesIO(data)) or "").strip()


def extract_pdf(data: bytes) -> str:
    try:
        text = _pdfminer_text(data)
    except Exception:
        text = ""

    if len(text) >= MIN_USEFUL_CHARS:
        return text

    try:
        fallback = _pypdf_text(data)
    except Exception:
        fallback = ""
    return fallback or text


def extract_text(data: bytes, kind: str) -> str:
    if kind == "pdf":
        return extract_pdf(data)
    document = Document(BytesIO(data))
    return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()


def preview(text: str) -> str:
    cleaned = text.strip() or "(No extractable text — the file may be image-only.)"
    if len(cleaned) <= PREVIEW_CHARS:
        return cleaned
    return f"{cleaned[:PREVIEW_CHARS].rstrip()}…"
