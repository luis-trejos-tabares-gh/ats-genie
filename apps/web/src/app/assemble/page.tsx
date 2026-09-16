"use client";

import { useState } from "react";
import { OutputLanguageSelect } from "@/components/output-language-select";
import { PrivacyConsent } from "@/components/privacy-consent";
import { UsageNotes } from "@/components/usage-notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OutputLanguage } from "@/i18n/config";
import { useT } from "@/i18n/provider";
import { assembleResume, downloadBlob, generateResume } from "@/lib/api";
import type { AssembleResponse, ResumeSections } from "@/lib/types";

const emptySections: ResumeSections = {
  contact: { name: "", email: "", phone: "", location: "", links: [] },
  summary: "",
  skills: [],
  experience: [],
  education: [],
  extras: "",
};

function toSections(form: {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  extras: string;
}): ResumeSections {
  return {
    contact: {
      name: form.name,
      email: form.email,
      phone: form.phone,
      location: form.location,
      links: [],
    },
    summary: form.summary,
    skills: form.skills
      .split(/[,|\n]/)
      .map((item) => item.trim())
      .filter(Boolean),
    experience: form.experience
      ? [{ title: "Experience", bullets: form.experience.split("\n").filter(Boolean) }]
      : [],
    education: form.education ? [{ school: "Education", credential: form.education }] : [],
    extras: form.extras,
  };
}

export default function AssemblePage() {
  const { t } = useT();
  const [consented, setConsented] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("keep");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: "",
    experience: "",
    education: "",
    extras: "",
  });
  const [result, setResult] = useState<AssembleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setResult(null);
    };
  }

  async function onAssemble(event: React.FormEvent) {
    event.preventDefault();
    if (!consented) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await assembleResume(toSections(form), outputLanguage));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("assemble.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onDownload(format: "docx" | "pdf") {
    const sections = result?.recommendation ?? emptySections;
    setBusy(true);
    setError(null);
    try {
      const blob = await generateResume(sections, format, result?.outputLanguage);
      downloadBlob(blob, `resume.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("assemble.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-mark">{t("assemble.kicker")}</p>
      <h1 className="mt-3 font-serif text-3xl tracking-tight">{t("assemble.title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("assemble.lead")}</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t("assemble.cardTitle")}</CardTitle>
          <CardDescription>{t("assemble.cardDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onAssemble}>
            <PrivacyConsent
              id="assemble-consent"
              checked={consented}
              onCheckedChange={setConsented}
            />
            <UsageNotes variant="assemble" />

            <fieldset disabled={!consented} className="space-y-5 disabled:opacity-60">
              <OutputLanguageSelect
                id="assemble-output-language"
                labelKey="assemble.outputLabel"
                value={outputLanguage}
                onChange={(value) => {
                  setOutputLanguage(value);
                  setResult(null);
                }}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("assemble.name")}</Label>
                  <Input id="name" value={form.name} onChange={update("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("assemble.email")}</Label>
                  <Input id="email" type="email" value={form.email} onChange={update("email")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("assemble.phone")}</Label>
                  <Input id="phone" value={form.phone} onChange={update("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t("assemble.location")}</Label>
                  <Input id="location" value={form.location} onChange={update("location")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">{t("assemble.summary")}</Label>
                <Textarea id="summary" value={form.summary} onChange={update("summary")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">{t("assemble.skills")}</Label>
                <Textarea
                  id="skills"
                  placeholder={t("assemble.skillsHint")}
                  value={form.skills}
                  onChange={update("skills")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">{t("assemble.experience")}</Label>
                <Textarea
                  id="experience"
                  placeholder={t("assemble.experienceHint")}
                  value={form.experience}
                  onChange={update("experience")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">{t("assemble.education")}</Label>
                <Textarea id="education" value={form.education} onChange={update("education")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extras">{t("assemble.extras")}</Label>
                <Textarea
                  id="extras"
                  placeholder={t("assemble.extrasHint")}
                  value={form.extras}
                  onChange={update("extras")}
                />
              </div>
            </fieldset>

            <Button type="submit" disabled={!consented || busy}>
              {busy ? t("assemble.working") : t("assemble.submit")}
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
              <CardTitle>{t("assemble.resultTitle")}</CardTitle>
              <CardDescription>{t("assemble.resultDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="font-medium">{result.recommendation.contact.name}</p>
              <p>{result.recommendation.summary}</p>
              <p className="text-muted-foreground">{result.recommendation.skills.join(" · ")}</p>
              {result.notes.length > 0 ? (
                <ul className="space-y-2">
                  {result.notes.map((note) => (
                    <li key={note.id} className="text-muted-foreground">
                      {note.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={busy} onClick={() => onDownload("docx")}>
              {t("assemble.downloadDocx")}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onDownload("pdf")}>
              {t("assemble.downloadPdf")}
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
