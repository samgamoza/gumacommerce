"use client"

import Image from "next/image"
import { Plus, Star } from "lucide-react"
import { useContext } from "react"
import { cn } from "@/lib/utils"
import { formatPrice, type Product } from "@/lib/store-data"
import { CartContext } from "@/components/v0-store/cart-provider"

const badgeStyles: Record<string, string> = {
  Deal: "bg-primary text-primary-foreground",
  New: "bg-accent text-accent-foreground",
  Bestseller: "bg-foreground text-background",
}

export function ProductCard({
  product,
  className,
  onAdd,
}: {
  product: Product
  className?: string
  onAdd?: (product: Product) => void
}) {
  const cart = useContext(CartContext)
  const add = onAdd ?? cart?.add
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/5",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span
            className={cn(
              "absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide",
              badgeStyles[product.badge] ?? "bg-secondary text-secondary-foreground",
            )}
          >
            {product.badge}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-background/90 px-2 py-1 text-[0.65rem] font-bold text-primary backdrop-blur">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-chart-3 text-chart-3" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>·</span>
          <span>{(product.sold / 1000).toFixed(1)}k sold</span>
        </div>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between pt-1.5">
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => add?.(product)}
            disabled={!add}
            aria-label={`Add ${product.name} to cart`}
            className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
          >
            <Plus className="size-4.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
