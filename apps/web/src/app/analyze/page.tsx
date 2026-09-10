"use client";

import { useState } from "react";
import { PrivacyConsent } from "@/components/privacy-consent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeResume, downloadBlob, generateResume } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";

export default function AnalyzePage() {
  const [consented, setConsented] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onAnalyze(event: React.FormEvent) {
    event.preventDefault();
    if (!consented || !file) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await analyzeResume(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDownload(format: "docx" | "pdf") {
    if (!result) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await generateResume(result.sections, format);
      downloadBlob(blob, `resume.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-mark">Analyze</p>
      <h1 className="mt-3 font-serif text-3xl tracking-tight">Guided corrections</h1>
      <p className="mt-3 text-muted-foreground">
        Upload a PDF or DOCX. We parse it in memory, list issues, and let you download a cleaner
        file. Nothing is saved.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Consent, then upload</CardTitle>
          <CardDescription>The checkbox is required before a file can leave your browser.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onAnalyze}>
            <PrivacyConsent checked={consented} onCheckedChange={setConsented} />
            <div className="space-y-2">
              <Label htmlFor="cv-file">Resume file</Label>
              <Input
                id="cv-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={!consented}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setResult(null);
                }}
              />
              <p className="text-xs text-muted-foreground">PDF or DOCX, 5 MB maximum.</p>
            </div>
            <Button type="submit" disabled={!consented || !file || busy}>
              {busy ? "Working…" : "Analyze resume"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <p className="mt-6 text-sm text-mark" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parsed preview</CardTitle>
              <CardDescription>{result.parsed.filename}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-xs">
                {result.parsed.textPreview}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issues</CardTitle>
              <CardDescription>Foundation stub — full category wizard comes next.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {result.issues.map((issue) => (
                  <li key={issue.id} className="border-l-2 border-mark/50 pl-3">
                    <p className="font-medium">
                      {issue.category} · {issue.severity}
                    </p>
                    <p className="text-muted-foreground">{issue.message}</p>
                    {issue.suggestion ? <p className="mt-1">{issue.suggestion}</p> : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={busy} onClick={() => onDownload("docx")}>
              Download DOCX
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onDownload("pdf")}>
              Download PDF
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
