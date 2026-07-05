"use client"

import Image from "next/image"
import { useState } from "react"
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { useCart } from "@/components/v0-store/cart-provider"
import { formatPrice } from "@/lib/store-data"
import { cn } from "@/lib/utils"

const payments = [
  { id: "gcash", label: "GCash" },
  { id: "card", label: "Card" },
  { id: "cod", label: "Cash on Delivery" },
]

export function CheckoutDrawer() {
  const { items, count, subtotal, isOpen, closeCart, setQty, remove, clear } = useCart()
  const [step, setStep] = useState<"cart" | "checkout" | "done">("cart")
  const [payment, setPayment] = useState("gcash")

  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 3.99
  const total = subtotal + shipping

  const handleClose = () => {
    closeCart()
    setTimeout(() => setStep("cart"), 250)
  }

  const placeOrder = () => {
    setStep("done")
    clear()
  }

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={handleClose}
        className={cn(
          "fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-label="Shopping cart and checkout"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <ShoppingBag className="size-5" />
            {step === "cart" && `Your cart (${count})`}
            {step === "checkout" && "Checkout"}
            {step === "done" && "Order placed"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Empty */}
        {step === "cart" && items.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-7 text-muted-foreground" />
            </span>
            <p className="font-display text-lg font-semibold text-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">
              Add something from a live stream or today&apos;s deals.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Start shopping
            </button>
          </div>
        )}

        {/* Cart items */}
        {step === "cart" && items.length > 0 && (
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-border p-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="font-display text-base font-bold text-primary">
                    {formatPrice(item.price)}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border border-border">
                      <button
                        type="button"
                        onClick={() => setQty(item.id, item.qty - 1)}
                        aria-label="Decrease quantity"
                        className="flex size-7 items-center justify-center rounded-full text-foreground hover:bg-muted"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                        className="flex size-7 items-center justify-center rounded-full text-foreground hover:bg-muted"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Checkout form */}
        {step === "checkout" && (
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Delivery details</h3>
              <input
                placeholder="Full name"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                placeholder="Mobile number"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <textarea
                placeholder="Delivery address"
                rows={2}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Payment method</h3>
              <div className="grid grid-cols-3 gap-2">
                {payments.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayment(p.id)}
                    className={cn(
                      "rounded-xl border px-2 py-3 text-xs font-semibold transition-colors",
                      payment === p.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:bg-muted",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
              <CheckCircle2 className="size-9" />
            </span>
            <p className="font-display text-xl font-bold text-foreground">Order confirmed!</p>
            <p className="text-sm text-muted-foreground text-pretty">
              We sent the receipt and tracking link to your Messenger. Thanks for shopping with
              Guma AI-commerce! 🎉
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Continue shopping
            </button>
          </div>
        )}

        {/* Footer / summary */}
        {step !== "done" && items.length > 0 && (
          <div className="border-t border-border p-5">
            <div className="mb-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-foreground">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-display text-base font-bold text-foreground">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            {step === "cart" ? (
              <button
                type="button"
                onClick={() => setStep("checkout")}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
              >
                Checkout · {formatPrice(total)}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={placeOrder}
                  className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
                >
                  Place order · {formatPrice(total)}
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
