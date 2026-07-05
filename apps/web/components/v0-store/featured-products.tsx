import { ArrowRight } from "lucide-react"
import { featured } from "@/lib/store-data"
import { ProductCard } from "@/components/v0-store/product-card"
import { SectionHeading } from "@/components/v0-store/section-heading"

export function FeaturedProducts() {
  return (
    <section id="featured" className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeading
        title="Featured products"
        subtitle="Hand-picked by our AI stylist for your feed"
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
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
