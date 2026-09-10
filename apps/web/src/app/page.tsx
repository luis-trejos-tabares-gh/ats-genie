import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-16 sm:pt-24">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-mark">A one-session resume desk</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          Get a resume ready for the parser — then download it and leave.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Applicant tracking systems stumble on columns, tables, and inconsistent headings. This tool
          checks an existing CV or builds one from your own words, using standard section names a
          parser can actually read.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/analyze">Analyze a CV</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/assemble">Build from scratch</Link>
          </Button>
        </div>
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-14 sm:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl">How it works</h2>
            <ol className="mt-6 space-y-5 text-sm leading-relaxed">
              <li>
                <span className="font-medium text-foreground">1. Choose a path.</span>{" "}
                <span className="text-muted-foreground">
                  Upload a PDF or DOCX to correct, or type each section yourself.
                </span>
              </li>
              <li>
                <span className="font-medium text-foreground">2. Consent, then process.</span>{" "}
                <span className="text-muted-foreground">
                  Nothing is sent until you accept the privacy terms. The file lives in memory for
                  that request only.
                </span>
              </li>
              <li>
                <span className="font-medium text-foreground">3. Review guided fixes.</span>{" "}
                <span className="text-muted-foreground">
                  Spelling, date formats, heading consistency, and ATS blockers — one category at a
                  time, not a wall of redlines.
                </span>
              </li>
              <li>
                <span className="font-medium text-foreground">4. Download and close.</span>{" "}
                <span className="text-muted-foreground">
                  Export DOCX (best for ATS) or PDF. We keep no copy.
                </span>
              </li>
            </ol>
          </div>
          <div>
            <h2 className="font-serif text-2xl">What “ATS-friendly” means here</h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>Single column. No tables, text boxes, or multi-column layouts.</li>
              <li>Standard headings: Summary, Skills, Experience, Education.</li>
              <li>Contact details in the body, not a header or footer graphic.</li>
              <li>Consistent dates and bullet style throughout.</li>
              <li>Your facts only — no invented jobs, degrees, or dates.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border-2 border-mark/40 bg-mark/5 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-mark">Privacy, before the buttons</p>
          <h2 className="mt-3 font-serif text-2xl">We do not store your resume</h2>
          <div className="mt-5 grid gap-4 text-sm leading-relaxed text-foreground/90 sm:grid-cols-2">
            <p>
              There are no accounts and no history. Your file is processed in memory for that
              request, then discarded. Closing the tab ends the session. We cannot recover it.
            </p>
            <p>
              Rewrites use GPT-OSS 120B via Groq — an open-weight public model. Groq does not train
              on API inputs. Turn on Zero Data Retention in the Groq console for this project.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Analyze a CV</CardTitle>
              <CardDescription>
                Upload what you have. Get a wizard of spelling, format, and parser issues, then
                download a cleaned version.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/analyze">Start analysis</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Build from scratch</CardTitle>
              <CardDescription>
                Paste bio, skills, jobs, and education in plain text. We recommend ATS-structured
                wording without inventing facts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/assemble">Open the assembler</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
