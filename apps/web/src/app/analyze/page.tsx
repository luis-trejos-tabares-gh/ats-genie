"use client";

import { useState } from "react";
import { OutputLanguageSelect } from "@/components/output-language-select";
import { PrivacyConsent } from "@/components/privacy-consent";
import { ResumeSectionsCard } from "@/components/resume-sections-card";
import { UsageNotes } from "@/components/usage-notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OutputLanguage } from "@/i18n/config";
import { useT } from "@/i18n/provider";
import { analyzeResume, downloadBlob, generateResume } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";

export default function AnalyzePage() {
  const { t } = useT();
  const [consented, setConsented] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("keep");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onAnalyze(event: React.FormEvent) {
    event.preventDefault();
    if (!consented || !file) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await analyzeResume(file, outputLanguage));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("analyze.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onDownload(format: "docx" | "pdf") {
    if (!result) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await generateResume(result.sections, format, result.outputLanguage);
      downloadBlob(blob, `resume.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("analyze.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-mark">{t("analyze.kicker")}</p>
      <h1 className="mt-3 font-serif text-3xl tracking-tight">{t("analyze.title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("analyze.lead")}</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t("analyze.cardTitle")}</CardTitle>
          <CardDescription>{t("analyze.cardDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onAnalyze}>
            <PrivacyConsent checked={consented} onCheckedChange={setConsented} />
            <UsageNotes variant="analyze" />
            <div className="space-y-2">
              <Label htmlFor="cv-file">{t("analyze.fileLabel")}</Label>
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
              <p className="text-xs text-muted-foreground">{t("analyze.fileHint")}</p>
            </div>
            <OutputLanguageSelect
              id="analyze-output-language"
              value={outputLanguage}
              disabled={!consented}
              onChange={(value) => {
                setOutputLanguage(value);
                setResult(null);
              }}
            />
            <Button type="submit" disabled={!consented || !file || busy}>
              {busy ? t("analyze.working") : t("analyze.submit")}
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
              <CardTitle>{t("analyze.previewTitle")}</CardTitle>
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
              <CardTitle>{t("analyze.issuesTitle")}</CardTitle>
              <CardDescription>{t("analyze.issuesDesc")}</CardDescription>
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

          <ResumeSectionsCard
            title={t("analyze.resultTitle")}
            description={t("analyze.resultDesc")}
            sections={result.sections}
          />

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={busy} onClick={() => onDownload("docx")}>
              {t("analyze.downloadDocx")}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onDownload("pdf")}>
              {t("analyze.downloadPdf")}
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
