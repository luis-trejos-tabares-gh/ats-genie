import type {
  AnalyzeResponse,
  AssembleRequest,
  AssembleResponse,
  GenerateFormat,
  GenerateRequest,
  HealthResponse,
  ResumeSections,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string | { msg?: string }[] };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail[0]?.msg) return body.detail[0].msg;
  } catch {
    /* ignore */
  }
  return `Request failed (${response.status})`;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<HealthResponse>;
}

export async function analyzeResume(file: File): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}/v1/analyze`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<AnalyzeResponse>;
}

export async function assembleResume(sections: ResumeSections): Promise<AssembleResponse> {
  const payload: AssembleRequest = { sections };
  const response = await fetch(`${API_URL}/v1/assemble`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<AssembleResponse>;
}

export async function generateResume(
  sections: ResumeSections,
  format: GenerateFormat,
): Promise<Blob> {
  const payload: GenerateRequest = { sections, format };
  const response = await fetch(`${API_URL}/v1/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
