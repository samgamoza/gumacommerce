import { TrendingUp } from "lucide-react"
import { popular } from "@/lib/store-data"
import { ProductCard } from "@/components/v0-store/product-card"
import { SectionHeading } from "@/components/v0-store/section-heading"

export function PopularProducts() {
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
        {popular.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
