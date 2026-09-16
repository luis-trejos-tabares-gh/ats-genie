import re

from app.models.schemas import ContactInfo, Issue, ResumeSections

HEADING_PATTERNS = (
    r"\b(professional\s+summary|summary|profile|resumen|perfil|resumo|zusammenfassung|profil)\b",
    r"\b(skills|technical\s+skills|competencias|competências|kenntnisse|f[aá]higkeiten)\b",
    r"\b(experience|work\s+experience|employment|experiencia|experiência|berufserfahrung|beruf)\b",
    r"\b(education|educaci[oó]n|forma[cç][aã]o|ausbildung|studium)\b",
)

DATE_PATTERNS = (
    re.compile(r"\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}\b"),
    re.compile(
        r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|ene|abr|ago|dic|jan|fev|mai|dez|m[aä]r|okt|dez)[a-zäöüß]*\s+(19|20)\d{2}\b",
        re.I,
    ),
    re.compile(r"\b\d{1,2}/\d{4}\b"),
)


def _issue(
    id_: str,
    category: str,
    severity: str,
    message: str,
    suggestion: str | None = None,
    field: str | None = None,
) -> Issue:
    return Issue(
        id=id_,
        category=category,  # type: ignore[arg-type]
        severity=severity,  # type: ignore[arg-type]
        message=message,
        suggestion=suggestion,
        fieldPath=field,
    )


def check_text(text: str) -> list[Issue]:
    issues: list[Issue] = []
    lower = text.lower()

    if not text.strip():
        issues.append(
            _issue(
                "empty-text",
                "structure",
                "error",
                "No readable text was extracted.",
                "Export a text-based PDF or DOCX. Image-only scans fail ATS parsers.",
            )
        )
        return issues

    missing = [
        label
        for label, pattern in zip(
            ("Summary", "Skills", "Experience", "Education"),
            HEADING_PATTERNS,
        )
        if not re.search(pattern, lower)
    ]
    if missing:
        issues.append(
            _issue(
                "missing-headings",
                "ats",
                "warning",
                f"Standard headings not found: {', '.join(missing)}.",
                "Use single-column headings such as Summary, Skills, Experience, Education.",
                "sections",
            )
        )

    if re.search(r"\t{2,}", text) or re.search(r"\|[^|\n]+\|[^|\n]+\|", text):
        issues.append(
            _issue(
                "tables-or-columns",
                "ats",
                "warning",
                "The file looks multi-column or table-based.",
                "Rewrite as a single column. Parsers often skip tables and text boxes.",
            )
        )

    date_styles = sum(1 for pattern in DATE_PATTERNS if pattern.search(text))
    if date_styles > 1:
        issues.append(
            _issue(
                "date-consistency",
                "consistency",
                "warning",
                "Date formats are mixed.",
                "Pick one style, e.g. Jun 2022 – Present, and use it everywhere.",
                "experience",
            )
        )

    if not re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text):
        issues.append(
            _issue(
                "missing-email",
                "structure",
                "warning",
                "No email address found in the body text.",
                "Put contact details in the document body, not a header graphic.",
                "contact.email",
            )
        )

    return issues


def sections_from_text(text: str) -> ResumeSections:
    email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = lines[0] if lines else None
    return ResumeSections(
        contact=ContactInfo(name=name, email=email_match.group(0) if email_match else None),
        summary="",
        skills=[],
        experience=[],
        education=[],
        extras="",
    )
