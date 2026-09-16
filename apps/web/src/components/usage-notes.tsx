"use client";

import { useT } from "@/i18n/provider";

export function UsageNotes({ variant }: { variant: "analyze" | "assemble" }) {
  const { t } = useT();

  return (
    <ul className="space-y-1 text-xs text-muted-foreground">
      <li>{t("limits.fairUse")}</li>
      <li>{t("limits.shared")}</li>
      {variant === "analyze" ? (
        <>
          <li>{t("limits.fileSize")}</li>
          <li>{t("limits.truncateFile")}</li>
        </>
      ) : (
        <li>{t("limits.truncatePaste")}</li>
      )}
    </ul>
  );
}
