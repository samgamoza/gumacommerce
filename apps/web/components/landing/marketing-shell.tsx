import Link from "next/link";
import { GumaMark } from "@guma-commerce/ui";
import { LandingNav } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

interface MarketingShellProps {
  children: React.ReactNode;
}

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  /** Optional meta line under the description (e.g. last updated). */
  meta?: string;
}

export function PageHeader({ eyebrow, title, description, meta }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-background to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-4 text-center sm:px-6 sm:pb-16">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
        {meta ? (
          <p className="mt-4 text-xs font-medium text-muted-foreground/90">{meta}</p>
        ) : null}
      </div>
    </section>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="relative mx-auto max-w-4xl px-4 pt-6 text-sm text-muted-foreground sm:px-6"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <GumaMark className="h-3.5 w-3.5" />
            Home
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span aria-hidden className="text-border">
              /
            </span>
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ContentSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 ${className}`}>
      <div className="prose-guma space-y-6 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:leading-relaxed [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function LegalDocLayout({
  toc,
  children,
}: {
  toc: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14 lg:py-16">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          On this page
        </p>
        <nav aria-label="Page sections" className="mt-4">
          <ul className="space-y-1 border-l border-border/70">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block border-l-2 border-transparent py-1.5 pl-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="prose-guma min-w-0 space-y-8 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:scroll-mt-28 [&_h2]:border-b [&_h2]:border-border/50 [&_h2]:pb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:leading-relaxed [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
