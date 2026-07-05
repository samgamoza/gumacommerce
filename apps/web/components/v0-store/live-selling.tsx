"use client"

import Image from "next/image"
import { Eye, Heart, Radio, ShoppingBag } from "lucide-react"
import { products, formatPrice } from "@/lib/store-data"
import { useCart } from "@/components/v0-store/cart-provider"

const liveProduct = products.find((p) => p.id === "serum")!

const upcoming = [
  { time: "6:00 PM", host: "Maya", topic: "Skincare Haul", tag: "Beauty" },
  { time: "8:30 PM", host: "Kai", topic: "Tech Under ₱5,000", tag: "Tech" },
  { time: "Tomorrow", host: "Bea", topic: "Fashion Finds", tag: "Fashion" },
]

export function LiveSelling() {
  const { add } = useCart()

  return (
    <section id="live" className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
          <span className="size-2 animate-pulse rounded-full bg-primary-foreground" /> Live
        </span>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Live selling
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Live stream card */}
        <div className="relative overflow-hidden rounded-3xl bg-foreground">
          <div className="relative aspect-video w-full sm:aspect-[16/10]">
            <Image
              src="/live/host.png"
              alt="Live host presenting a product"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
            {/* top bar */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
              <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">
                <Radio className="size-3.5" /> Live
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                  <Eye className="size-3.5" /> 2.4k
                </span>
                <span className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                  <Heart className="size-3.5 fill-current text-primary" /> 8.1k
                </span>
              </div>
            </div>
            {/* bottom product bar */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-2.5 backdrop-blur">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={liveProduct.image || "/placeholder.svg"}
                    alt={liveProduct.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {liveProduct.name}
                  </p>
                  <p className="font-display text-base font-bold text-primary">
                    {formatPrice(liveProduct.price)}{" "}
                    <span className="text-xs font-normal text-muted-foreground line-through">
                      {liveProduct.originalPrice && formatPrice(liveProduct.originalPrice)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => add(liveProduct)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                >
                  <ShoppingBag className="size-4" /> Grab
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming schedule */}
        <div className="flex flex-col rounded-3xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold text-card-foreground">Upcoming streams</h3>
          <p className="mb-4 text-sm text-muted-foreground">Set a reminder in Messenger</p>
          <ul className="flex flex-col gap-3">
            {upcoming.map((s) => (
              <li
                key={s.topic}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
              >
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-center text-primary">
                  <span className="text-[0.6rem] font-semibold uppercase leading-none">
                    {s.time.includes(":") ? s.time.split(" ")[1] : "Soon"}
                  </span>
                  <span className="text-sm font-bold leading-tight">
                    {s.time.includes(":") ? s.time.split(" ")[0] : s.time}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{s.topic}</p>
                  <p className="text-xs text-muted-foreground">with {s.host}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {s.tag}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Radio className="size-4" /> Notify me
          </button>
        </div>
      </div>
    </section>
  )
}
