"use client";

import { Label } from "@/components/ui/label";
import { OUTPUT_LANGUAGES, type OutputLanguage } from "@/i18n/config";
import { useT } from "@/i18n/provider";

interface OutputLanguageSelectProps {
  id: string;
  value: OutputLanguage;
  onChange: (value: OutputLanguage) => void;
  disabled?: boolean;
  labelKey?: string;
}

export function OutputLanguageSelect({
  id,
  value,
  onChange,
  disabled,
  labelKey = "analyze.outputLabel",
}: OutputLanguageSelectProps) {
  const { t } = useT();

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t(labelKey)}</Label>
      <select
        id={id}
        disabled={disabled}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
        value={value}
        onChange={(event) => onChange(event.target.value as OutputLanguage)}
      >
        {OUTPUT_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {t(`output.${code}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
