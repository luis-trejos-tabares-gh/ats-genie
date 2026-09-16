from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

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
OutputLanguage = Literal["keep", "en", "es", "pt", "de"]
DetectedLanguage = Literal["en", "es", "pt", "de"]


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
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = None
    employer: str | None = None
    startDate: str | None = Field(default=None, validation_alias=AliasChoices("startDate", "start_date"))
    endDate: str | None = Field(default=None, validation_alias=AliasChoices("endDate", "end_date"))
    bullets: list[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    school: str | None = None
    credential: str | None = None
    startDate: str | None = Field(default=None, validation_alias=AliasChoices("startDate", "start_date"))
    endDate: str | None = Field(default=None, validation_alias=AliasChoices("endDate", "end_date"))


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
    truncated: bool = False


class AnalyzeResponse(BaseModel):
    parsed: ParsedDocument
    issues: list[Issue]
    sections: ResumeSections
    detectedLanguage: DetectedLanguage | None = None
    outputLanguage: DetectedLanguage | None = None


class AssembleRequest(BaseModel):
    sections: ResumeSections
    outputLanguage: OutputLanguage = "keep"


class AssembleResponse(BaseModel):
    recommendation: ResumeSections
    notes: list[Issue]
    detectedLanguage: DetectedLanguage | None = None
    outputLanguage: DetectedLanguage | None = None


class GenerateRequest(BaseModel):
    sections: ResumeSections
    format: GenerateFormat = "docx"
    language: DetectedLanguage | None = None


class HealthResponse(BaseModel):
    status: Literal["ok"]
    groqConfigured: bool
    model: str
