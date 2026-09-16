"use client";

import { LanguageProvider } from "@/i18n/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
