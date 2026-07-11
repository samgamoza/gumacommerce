import { TrendingUp } from "lucide-react"
import type { Product } from "@/lib/store-data"
import { popular } from "@/lib/store-data"
import { ProductCard } from "@/components/v0-store/product-card"
import { SectionHeading } from "@/components/v0-store/section-heading"

export function PopularProducts({
  items = popular,
  onAdd,
}: {
  items?: Product[]
  onAdd?: (product: Product) => void
}) {
  if (items.length === 0) return null

  return (
    <section id="popular" className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeading
        title="Popular right now"
        subtitle="Most-loved picks across every platform"
        action={
          <span className="hidden items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent sm:flex">
            <TrendingUp className="size-4" /> Trending
          </span>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} />
        ))}
      </div>
    </section>
  )
}
