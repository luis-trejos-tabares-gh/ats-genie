from fastapi import APIRouter, Request

from app.models.schemas import AssembleRequest, AssembleResponse, Issue, ResumeSections
from app.rate_limit import enforce_rate_limit

router = APIRouter()


def _recommend(sections: ResumeSections) -> ResumeSections:
    summary = sections.summary.strip()
    return ResumeSections(
        contact=sections.contact,
        summary=summary,
        skills=[skill.strip() for skill in sections.skills if skill.strip()],
        experience=sections.experience,
        education=sections.education,
        extras=sections.extras.strip(),
    )


@router.post("/v1/assemble", response_model=AssembleResponse)
async def assemble(request: Request, payload: AssembleRequest) -> AssembleResponse:
    enforce_rate_limit(request)
    recommendation = _recommend(payload.sections)
    notes = [
        Issue(
            id="foundation-stub",
            category="structure",
            severity="info",
            message="Foundation assemble returns your text under standard ATS headings. Groq rewriting is wired but not called yet.",
            suggestion="We will not invent employers, dates, or degrees.",
        )
    ]
    if not recommendation.summary:
        notes.append(
            Issue(
                id="missing-summary",
                category="structure",
                severity="warning",
                message="No summary was provided.",
                suggestion="Add a 2–3 sentence professional summary in your own words.",
                fieldPath="summary",
            )
        )
    if not recommendation.skills:
        notes.append(
            Issue(
                id="missing-skills",
                category="ats",
                severity="warning",
                message="No skills listed.",
                suggestion="List skills as a simple comma-separated line, not a table.",
                fieldPath="skills",
            )
        )
    return AssembleResponse(recommendation=recommendation, notes=notes)
