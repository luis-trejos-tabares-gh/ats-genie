"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEY, isUiLocale, lookup, type UiLocale } from "./config";

interface LanguageContextValue {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isUiLocale(stored)) setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        setLocaleState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
      },
      t: (key) => lookup(locale, key),
    }),
    [locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useT must be used within LanguageProvider");
  return context;
}
