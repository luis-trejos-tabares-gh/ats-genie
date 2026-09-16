"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/provider";

interface PrivacyConsentProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export function PrivacyConsent({ checked, onCheckedChange, id = "privacy-consent" }: PrivacyConsentProps) {
  const { t } = useT();

  return (
    <div className="rounded-xl border border-mark/30 bg-mark/5 p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-0.5"
        />
        <Label htmlFor={id} className="cursor-pointer text-sm leading-relaxed font-normal">
          {t("consent.label")}
        </Label>
      </div>
      <ul className="mt-3 space-y-1 pl-7 text-xs text-muted-foreground">
        <li>{t("consent.noAccounts")}</li>
        <li>{t("consent.noRecover")}</li>
        <li>{t("consent.noTrain")}</li>
      </ul>
    </div>
  );
}
