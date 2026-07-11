import { ArrowRight } from "lucide-react"
import type { Product } from "@/lib/store-data"
import { featured } from "@/lib/store-data"
import { ProductCard } from "@/components/v0-store/product-card"
import { SectionHeading } from "@/components/v0-store/section-heading"

export function FeaturedProducts({
  items = featured,
  onAdd,
  subtitle = "Hand-picked by our AI stylist for your feed",
}: {
  items?: Product[]
  onAdd?: (product: Product) => void
  subtitle?: string
}) {
  if (items.length === 0) return null

  return (
    <section id="featured" className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeading
        title="Featured products"
        subtitle={subtitle}
        action={
          <a
            href="#popular"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            View all <ArrowRight className="size-4" />
          </a>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} />
        ))}
      </div>
    </section>
  )
}
