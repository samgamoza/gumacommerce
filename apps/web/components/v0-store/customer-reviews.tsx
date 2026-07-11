import { Star } from "lucide-react"
import type { Review } from "@/lib/store-data"
import { reviews as defaultReviews } from "@/lib/store-data"
import { SectionHeading } from "@/components/v0-store/section-heading"
import { cn } from "@/lib/utils"

const platformStyles: Record<string, string> = {
  Facebook: "bg-[oklch(0.55_0.18_255)] text-white",
  Instagram: "bg-primary text-primary-foreground",
  TikTok: "bg-foreground text-background",
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
}

export function CustomerReviews({ items = defaultReviews }: { items?: Review[] }) {
  if (items.length === 0) return null

  return (
    <section className="bg-secondary/50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          title="Loved by social shoppers"
          subtitle="Real reviews from buyers across Facebook, Instagram & TikTok"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((r) => (
            <figure
              key={r.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-4",
                      i < r.rating
                        ? "fill-chart-3 text-chart-3"
                        : "fill-muted text-muted",
                    )}
                  />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-card-foreground text-pretty">
                &ldquo;{r.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                  {initials(r.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.handle}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                    platformStyles[r.platform],
                  )}
                >
                  {r.platform}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
