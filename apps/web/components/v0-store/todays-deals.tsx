"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"
import type { Product } from "@/lib/store-data"
import { deals } from "@/lib/store-data"
import { ProductCard } from "@/components/v0-store/product-card"

function Countdown() {
  const [time, setTime] = useState({ h: 5, m: 42, s: 18 })

  useEffect(() => {
    const id = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev
        s -= 1
        if (s < 0) {
          s = 59
          m -= 1
        }
        if (m < 0) {
          m = 59
          h -= 1
        }
        if (h < 0) {
          h = 5
          m = 59
          s = 59
        }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, "0")

  return (
    <div className="flex items-center gap-1.5 font-display font-bold tabular-nums">
      {[time.h, time.m, time.s].map((unit, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="flex min-w-8 items-center justify-center rounded-lg bg-foreground px-2 py-1 text-sm text-background">
            {pad(unit)}
          </span>
          {i < 2 && <span className="text-foreground">:</span>}
        </span>
      ))}
    </div>
  )
}

export function TodaysDeals({
  items = deals,
  onAdd,
}: {
  items?: Product[]
  onAdd?: (product: Product) => void
}) {
  if (items.length === 0) return null

  return (
    <section className="bg-primary/5 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="size-5 fill-current" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Today&apos;s deals
              </h2>
              <p className="text-sm text-muted-foreground">Flash prices, limited stock</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Ends in</span>
            <Countdown />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </section>
  )
}
