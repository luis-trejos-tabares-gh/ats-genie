"use client";

import { useState } from "react";
import { PrivacyConsent } from "@/components/privacy-consent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    education: form.education
      ? [{ school: "Education", credential: form.education }]
      : [],
    extras: form.extras,
  };
}

export default function AssemblePage() {
  const [consented, setConsented] = useState(false);
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
      setResult(await assembleResume(toSections(form)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assemble failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDownload(format: "docx" | "pdf") {
    const sections = result?.recommendation ?? emptySections;
    setBusy(true);
    setError(null);
    try {
      const blob = await generateResume(sections, format);
      downloadBlob(blob, `resume.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-mark">Assemble</p>
      <h1 className="mt-3 font-serif text-3xl tracking-tight">Build from your own words</h1>
      <p className="mt-3 text-muted-foreground">
        Write each section in plain language. We recommend ATS headings and phrasing without adding
        employers, dates, or degrees you did not provide.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Consent required</CardTitle>
          <CardDescription>Your text is sent only after you accept the terms below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onAssemble}>
            <PrivacyConsent
              id="assemble-consent"
              checked={consented}
              onCheckedChange={setConsented}
            />

            <fieldset disabled={!consented} className="space-y-5 disabled:opacity-60">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} onChange={update("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={update("email")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={update("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location} onChange={update("location")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Bio / summary</Label>
                <Textarea id="summary" value={form.summary} onChange={update("summary")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Textarea
                  id="skills"
                  placeholder="Comma or line separated"
                  value={form.skills}
                  onChange={update("skills")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Job history</Label>
                <Textarea
                  id="experience"
                  placeholder="One role or bullet per line"
                  value={form.experience}
                  onChange={update("experience")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Textarea id="education" value={form.education} onChange={update("education")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extras">Extras</Label>
                <Textarea
                  id="extras"
                  placeholder="Certifications, languages, projects"
                  value={form.extras}
                  onChange={update("extras")}
                />
              </div>
            </fieldset>

            <Button type="submit" disabled={!consented || busy}>
              {busy ? "Working…" : "Generate recommendation"}
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
              <CardTitle>Recommendation</CardTitle>
              <CardDescription>Foundation stub — live Groq rewrite comes next.</CardDescription>
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
