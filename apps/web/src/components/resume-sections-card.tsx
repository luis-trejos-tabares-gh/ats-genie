import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumeSections } from "@/lib/types";

export function ResumeSectionsCard({
  title,
  description,
  sections,
}: {
  title: string;
  description: string;
  sections: ResumeSections;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="font-medium">{sections.contact.name}</p>
        {sections.summary ? <p>{sections.summary}</p> : null}
        {sections.skills.length > 0 ? (
          <p className="text-muted-foreground">{sections.skills.join(" · ")}</p>
        ) : null}
        {sections.experience.map((item, index) => (
          <div key={`${item.employer ?? "role"}-${index}`}>
            <p className="font-medium">
              {[item.title, item.employer].filter(Boolean).join(" · ")}
            </p>
            {item.bullets?.length ? (
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
