import json

from pydantic import ValidationError

from app.config import settings
from app.models.schemas import Issue, ResumeSections
from app.services.groq_client import GroqError, complete_json

SYSTEM_PROMPT = """You are an ATS resume editor for a free support tool.
Return a single JSON object only. Use this exact shape and these exact English keys (camelCase):

{
  "detectedLanguage": "en",
  "outputLanguage": "en",
  "issues": [
    {
      "id": "string",
      "category": "spelling|grammar|formatting|ats|consistency|structure",
      "severity": "info|warning|error",
      "message": "string",
      "suggestion": "string",
      "fieldPath": "summary"
    }
  ],
  "sections": {
    "contact": {"name": "", "email": "", "phone": "", "location": "", "links": []},
    "summary": "",
    "skills": ["skill"],
    "experience": [
      {"title": "", "employer": "", "startDate": "", "endDate": "", "bullets": [""]}
    ],
    "education": [
      {"school": "", "credential": "", "startDate": "", "endDate": ""}
    ],
    "extras": ""
  }
}

Rules:
- Always fill "sections" from facts in the source. Do not leave sections empty if the source has content.
- Put the rewritten CV only under "sections", never under "recommendation" or "resume".
- Never invent employers, job titles, dates, degrees, skills, or contact details.
- Keep names, emails, phone numbers, and URLs unchanged.
- skills must be an array of strings. experience and education must be arrays of objects.
- If outputLanguage is "keep", write issue messages, suggestions, and section prose in detectedLanguage.
- If outputLanguage is en, es, pt, or de, write those strings in that language. Do not translate proper nouns.
- detectedLanguage and outputLanguage must be one of: en, es, pt, de.
- Include fieldPath when an issue maps to a section.
"""


def truncate_text(text: str) -> tuple[str, bool]:
    limit = settings.prompt_char_limit
    if len(text) <= limit:
        return text, False
    return text[:limit].rstrip(), True


def truncation_issue(output_language: str) -> Issue:
    copy = {
        "en": (
            "This resume was shortened before analysis. Later pages may be ignored.",
            "Keep the CV under a few pages, or put the most important roles first.",
        ),
        "es": (
            "Este currículum se acortó antes del análisis. Es posible que se ignoren las páginas posteriores.",
            "Deja el CV en pocas páginas o pon primero los puestos más importantes.",
        ),
        "pt": (
            "Este currículo foi encurtado antes da análise. Páginas posteriores podem ser ignoradas.",
            "Mantenha o CV em poucas páginas ou coloque as funções mais importantes primeiro.",
        ),
        "de": (
            "Dieser Lebenslauf wurde vor der Analyse gekürzt. Spätere Seiten können fehlen.",
            "Halten Sie den Lebenslauf kurz oder setzen Sie die wichtigsten Stationen nach oben.",
        ),
    }
    message, suggestion = copy.get(output_language, copy["en"])
    return Issue(
        id="truncated-source",
        category="structure",
        severity="info",
        message=message,
        suggestion=suggestion,
        fieldPath="sections",
    )


def _normalize_sections_payload(raw: object) -> dict:
    if not isinstance(raw, dict):
        return {}
    data = dict(raw)
    skills = data.get("skills")
    if isinstance(skills, str):
        data["skills"] = [part.strip() for part in skills.replace(";", ",").split(",") if part.strip()]
    experience = data.get("experience")
    if isinstance(experience, dict):
        data["experience"] = [experience]
    education = data.get("education")
    if isinstance(education, dict):
        data["education"] = [education]
    return data


def _extract_sections_dict(payload: dict) -> dict:
    for key in ("sections", "recommendation", "resume"):
        value = payload.get(key)
        if isinstance(value, dict) and value:
            return _normalize_sections_payload(value)
    return _normalize_sections_payload(payload.get("sections") or {})


def _has_content(sections: ResumeSections) -> bool:
    if sections.summary.strip():
        return True
    if any(skill.strip() for skill in sections.skills):
        return True
    if any(item.title or item.employer or item.bullets for item in sections.experience):
        return True
    if any(item.school or item.credential for item in sections.education):
        return True
    if sections.extras.strip():
        return True
    contact = sections.contact
    if contact.name or contact.email or contact.phone:
        return True
    return False


def _parse_recommendation(payload: dict) -> tuple[str, str, list[Issue], ResumeSections]:
    detected = payload.get("detectedLanguage") or payload.get("detected_language") or "en"
    output = payload.get("outputLanguage") or payload.get("output_language") or detected
    if detected not in {"en", "es", "pt", "de"}:
        detected = "en"
    if output not in {"en", "es", "pt", "de"}:
        output = detected

    issues: list[Issue] = []
    for raw in payload.get("issues") or payload.get("notes") or []:
        if not isinstance(raw, dict):
            continue
        try:
            issues.append(Issue.model_validate(raw))
        except ValidationError:
            continue

    try:
        sections = ResumeSections.model_validate(_extract_sections_dict(payload))
    except ValidationError as exc:
        raise GroqError("The AI service returned an invalid resume structure.") from exc
    if not _has_content(sections):
        raise GroqError("The AI service returned no resume content to download.")
    return detected, output, issues, sections


def _merge_issues(model_issues: list[Issue], extras: list[Issue]) -> list[Issue]:
    seen = {issue.id for issue in model_issues}
    merged = list(model_issues)
    for extra in extras:
        if extra.id not in seen:
            merged.append(extra)
            seen.add(extra.id)
    return merged


def recommend_from_text(
    text: str,
    output_language: str,
    deterministic_issues: list[Issue],
) -> tuple[str, str, list[Issue], ResumeSections, bool]:
    clipped, truncated = truncate_text(text)
    extras = [truncation_issue(output_language if output_language != "keep" else "en")] if truncated else []
    user_prompt = (
        f"outputLanguage: {output_language}\n"
        f"deterministicHints: {json.dumps([issue.model_dump() for issue in deterministic_issues], ensure_ascii=False)}\n\n"
        "Extract ATS sections from this resume text into the sections object and list guided issues. "
        "sections must contain the rewritten CV ready to download. "
        "Restate applicable deterministicHints in the output language.\n\n"
        f"{clipped}"
    )
    payload = complete_json(SYSTEM_PROMPT, user_prompt)
    detected, resolved, issues, sections = _parse_recommendation(payload)
    if truncated and output_language == "keep":
        extras = [truncation_issue(detected)]
    return detected, resolved, _merge_issues(issues, extras), sections, truncated


def recommend_from_sections(
    sections: ResumeSections,
    output_language: str,
) -> tuple[str, str, list[Issue], ResumeSections, bool]:
    raw = json.dumps(sections.model_dump(), ensure_ascii=False)
    clipped, truncated = truncate_text(raw)
    extras = [truncation_issue(output_language if output_language != "keep" else "en")] if truncated else []
    user_prompt = (
        f"outputLanguage: {output_language}\n"
        "Turn this user-provided resume JSON into an ATS-friendly recommendation. "
        "Put the rewritten CV in sections. Do not add facts. Return issues as notes.\n\n"
        f"{clipped}"
    )
    payload = complete_json(SYSTEM_PROMPT, user_prompt)
    detected, resolved, issues, recommendation = _parse_recommendation(payload)
    if truncated and output_language == "keep":
        extras = [truncation_issue(detected)]
    return detected, resolved, _merge_issues(issues, extras), recommendation, truncated
