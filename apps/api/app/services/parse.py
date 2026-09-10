from io import BytesIO

from docx import Document
from pypdf import PdfReader

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}
ALLOWED_EXTENSIONS = {".pdf": "pdf", ".docx": "docx"}
PREVIEW_CHARS = 4000


def detect_kind(filename: str, content_type: str | None) -> str | None:
    lower = filename.lower()
    for suffix, kind in ALLOWED_EXTENSIONS.items():
        if lower.endswith(suffix):
            return kind
    if content_type in ALLOWED_TYPES:
        return ALLOWED_TYPES[content_type]
    return None


def extract_text(data: bytes, kind: str) -> str:
    if kind == "pdf":
        reader = PdfReader(BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages).strip()
    document = Document(BytesIO(data))
    return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()


def preview(text: str) -> str:
    cleaned = text.strip() or "(No extractable text — the file may be image-only.)"
    if len(cleaned) <= PREVIEW_CHARS:
        return cleaned
    return f"{cleaned[:PREVIEW_CHARS].rstrip()}…"
