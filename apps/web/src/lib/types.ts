export type IssueSeverity = "info" | "warning" | "error";

export type IssueCategory =
  | "spelling"
  | "grammar"
  | "formatting"
  | "ats"
  | "consistency"
  | "structure";

export type ResumeSectionKey =
  | "contact"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "extras";

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
  suggestion?: string;
  fieldPath?: string;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: string[];
}

export interface ExperienceItem {
  title?: string;
  employer?: string;
  startDate?: string;
  endDate?: string;
  bullets?: string[];
}

export interface EducationItem {
  school?: string;
  credential?: string;
  startDate?: string;
  endDate?: string;
}

export interface ResumeSections {
  contact: ContactInfo;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  extras: string;
}

export interface AnalyzeResponse {
  parsed: {
    filename: string;
    textPreview: string;
  };
  issues: Issue[];
  sections: ResumeSections;
}

export interface AssembleRequest {
  sections: ResumeSections;
}

export interface AssembleResponse {
  recommendation: ResumeSections;
  notes: Issue[];
}

export type GenerateFormat = "docx" | "pdf";

export interface GenerateRequest {
  sections: ResumeSections;
  format: GenerateFormat;
}

export interface HealthResponse {
  status: "ok";
  groqConfigured: boolean;
  model: string;
}
