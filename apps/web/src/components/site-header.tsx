import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-lg tracking-tight">ATS Assistant</span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            Proof, then print
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/analyze" className="text-muted-foreground hover:text-foreground">
            Analyze
          </Link>
          <Link href="/assemble" className="text-muted-foreground hover:text-foreground">
            Assemble
          </Link>
        </nav>
      </div>
    </header>
  );
}
