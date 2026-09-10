"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const CONSENT_LABEL =
  "I understand my resume is sent to our processor and an open-weight GPT-OSS model on Groq for this request only, is not stored, and is not used to train models.";

interface PrivacyConsentProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export function PrivacyConsent({ checked, onCheckedChange, id = "privacy-consent" }: PrivacyConsentProps) {
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
          {CONSENT_LABEL}
        </Label>
      </div>
      <ul className="mt-3 space-y-1 pl-7 text-xs text-muted-foreground">
        <li>No accounts. Closing this tab discards everything.</li>
        <li>We cannot recover a lost session.</li>
        <li>Groq does not train on API data. Enable Zero Data Retention in the Groq console for this project.</li>
      </ul>
    </div>
  );
}
