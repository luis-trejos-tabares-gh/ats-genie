import de from "./messages/de.json";
import en from "./messages/en.json";
import es from "./messages/es.json";
import pt from "./messages/pt.json";

export const UI_LOCALES = ["en", "es", "pt", "de"] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

export const OUTPUT_LANGUAGES = ["keep", "en", "es", "pt", "de"] as const;
export type OutputLanguage = (typeof OUTPUT_LANGUAGES)[number];

export const STORAGE_KEY = "ats-ui-locale";

export const messages = { en, es, pt, de } as const;

export function isUiLocale(value: string | null | undefined): value is UiLocale {
  return value === "en" || value === "es" || value === "pt" || value === "de";
}

export function lookup(locale: UiLocale, key: string): string {
  const parts = key.split(".");
  let node: unknown = messages[locale];
  for (const part of parts) {
    if (typeof node !== "object" || node === null || !(part in node)) {
      node = messages.en;
      for (const fallback of parts) {
        if (typeof node !== "object" || node === null || !(fallback in node)) return key;
        node = (node as Record<string, unknown>)[fallback];
      }
      break;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : key;
}
