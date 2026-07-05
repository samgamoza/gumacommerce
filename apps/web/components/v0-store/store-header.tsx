"use client"

import { useState } from "react"
import { Search, ShoppingBag, Sparkles, Heart, Menu } from "lucide-react"
import { categories } from "@/lib/store-data"
import { useCart } from "@/components/v0-store/cart-provider"

export function StoreHeader() {
  const { count, openCart } = useCart()
  const [query, setQuery] = useState("")

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4">
        {/* Logo */}
        <a href="#" className="flex shrink-0 items-center gap-2" aria-label="Guma AI-commerce home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Guma AI-commerce
          </span>
        </a>

        {/* Search */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-1 items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-2 transition-colors focus-within:border-primary focus-within:bg-background"
        >
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands & live shops"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Search products"
          />
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary sm:inline-flex">
            <Sparkles className="size-3" /> AI
          </span>
        </form>

        {/* Actions */}
        <button
          type="button"
          aria-label="Favorites"
          className="hidden size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted sm:flex"
        >
          <Heart className="size-5" />
        </button>
        <button
          type="button"
          onClick={openCart}
          aria-label={`Open cart, ${count} items`}
          className="relative flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-95"
        >
          <ShoppingBag className="size-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label="Menu"
          className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Categories */}
      <nav className="mx-auto max-w-6xl px-4 pb-3" aria-label="Product categories">
        <ul className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {categories.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={
                  "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                  (i === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted")
                }
              >
                {"emoji" in c && c.emoji ? `${c.emoji} ` : ""}
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
