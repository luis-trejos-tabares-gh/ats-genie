from typing import Literal

from pydantic import BaseModel, Field

IssueSeverity = Literal["info", "warning", "error"]
IssueCategory = Literal[
    "spelling",
    "grammar",
    "formatting",
    "ats",
    "consistency",
    "structure",
]
GenerateFormat = Literal["docx", "pdf"]


class Issue(BaseModel):
    id: str
    category: IssueCategory
    severity: IssueSeverity
    message: str
    suggestion: str | None = None
    fieldPath: str | None = None


class ContactInfo(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    links: list[str] = Field(default_factory=list)


class ExperienceItem(BaseModel):
    title: str | None = None
    employer: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    bullets: list[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    school: str | None = None
    credential: str | None = None
    startDate: str | None = None
    endDate: str | None = None


class ResumeSections(BaseModel):
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: str = ""
    skills: list[str] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    extras: str = ""


class ParsedDocument(BaseModel):
    filename: str
    textPreview: str


class AnalyzeResponse(BaseModel):
    parsed: ParsedDocument
    issues: list[Issue]
    sections: ResumeSections


class AssembleRequest(BaseModel):
    sections: ResumeSections


class AssembleResponse(BaseModel):
    recommendation: ResumeSections
    notes: list[Issue]


class GenerateRequest(BaseModel):
    sections: ResumeSections
    format: GenerateFormat = "docx"


class HealthResponse(BaseModel):
    status: Literal["ok"]
    groqConfigured: bool
    model: str
