"use client";

import Link from "next/link";
import { useT } from "@/i18n/provider";
import { UI_LOCALES, type UiLocale } from "@/i18n/config";

export function SiteHeader() {
  const { t, locale, setLocale } = useT();

  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-lg tracking-tight">ATS Assistant</span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            {t("header.tagline")}
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/analyze" className="text-muted-foreground hover:text-foreground">
            {t("header.analyze")}
          </Link>
          <Link href="/assemble" className="text-muted-foreground hover:text-foreground">
            {t("header.assemble")}
          </Link>
          <label className="sr-only" htmlFor="ui-locale">
            {t("header.language")}
          </label>
          <select
            id="ui-locale"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={locale}
            onChange={(event) => setLocale(event.target.value as UiLocale)}
          >
            {UI_LOCALES.map((code) => (
              <option key={code} value={code}>
                {t(`output.${code}`)}
              </option>
            ))}
          </select>
        </nav>
      </div>
    </header>
  );
}
