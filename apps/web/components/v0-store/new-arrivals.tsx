import type { Product } from "@/lib/store-data"
import { newArrivals } from "@/lib/store-data"
import { ProductCard } from "@/components/v0-store/product-card"
import { SectionHeading } from "@/components/v0-store/section-heading"

export function NewArrivals({
  items = newArrivals,
  onAdd,
}: {
  items?: Product[]
  onAdd?: (product: Product) => void
}) {
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeading title="New arrivals" subtitle="Fresh drops added this week" />
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAdd={onAdd}
            className="w-44 shrink-0 snap-start sm:w-auto"
          />
        ))}
      </div>
    </section>
  )
}
