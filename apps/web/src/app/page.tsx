"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/i18n/provider";

export default function HomePage() {
  const { t } = useT();

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-16 sm:pt-24">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-mark">{t("landing.kicker")}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          {t("landing.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t("landing.lead")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/analyze">{t("landing.ctaAnalyze")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/assemble">{t("landing.ctaAssemble")}</Link>
          </Button>
        </div>
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-14 sm:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl">{t("landing.howTitle")}</h2>
            <ol className="mt-6 space-y-5 text-sm leading-relaxed">
              <li>
                <span className="font-medium text-foreground">{t("landing.how1Title")}</span>{" "}
                <span className="text-muted-foreground">{t("landing.how1Body")}</span>
              </li>
              <li>
                <span className="font-medium text-foreground">{t("landing.how2Title")}</span>{" "}
                <span className="text-muted-foreground">{t("landing.how2Body")}</span>
              </li>
              <li>
                <span className="font-medium text-foreground">{t("landing.how3Title")}</span>{" "}
                <span className="text-muted-foreground">{t("landing.how3Body")}</span>
              </li>
              <li>
                <span className="font-medium text-foreground">{t("landing.how4Title")}</span>{" "}
                <span className="text-muted-foreground">{t("landing.how4Body")}</span>
              </li>
            </ol>
          </div>
          <div>
            <h2 className="font-serif text-2xl">{t("landing.atsTitle")}</h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>{t("landing.ats1")}</li>
              <li>{t("landing.ats2")}</li>
              <li>{t("landing.ats3")}</li>
              <li>{t("landing.ats4")}</li>
              <li>{t("landing.ats5")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border-2 border-mark/40 bg-mark/5 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-mark">{t("landing.privacyKicker")}</p>
          <h2 className="mt-3 font-serif text-2xl">{t("landing.privacyTitle")}</h2>
          <div className="mt-5 grid gap-4 text-sm leading-relaxed text-foreground/90 sm:grid-cols-2">
            <p>{t("landing.privacy1")}</p>
            <p>{t("landing.privacy2")}</p>
          </div>
          <div className="mt-6 border-t border-mark/20 pt-5">
            <h3 className="font-serif text-lg">{t("landing.limitsTitle")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              <li>{t("landing.limits1")}</li>
              <li>{t("landing.limits2")}</li>
              <li>{t("landing.limits3")}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("landing.cardAnalyzeTitle")}</CardTitle>
              <CardDescription>{t("landing.cardAnalyzeBody")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/analyze">{t("landing.cardAnalyzeCta")}</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("landing.cardAssembleTitle")}</CardTitle>
              <CardDescription>{t("landing.cardAssembleBody")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/assemble">{t("landing.cardAssembleCta")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
