"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Minus, Plus, MessageCircle, ShoppingBag } from "lucide-react";
import type { DemoProduct } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { ctaTextColor, solidCtaColor } from "@/lib/color-contrast";
import { resolveCommerceChrome } from "@guma-commerce/storefront-themes";

export function AddToCartButton({
  tenantSlug,
  product,
  accent,
  category,
}: {
  tenantSlug: string;
  product: DemoProduct;
  accent: string;
  /** Tenant business category — drives retail vs service CTA language. */
  category?: string | null;
}) {
  // Resolve chrome on the client — never pass chrome objects (they include functions)
  // from Server Components into this client boundary.
  const chrome = resolveCommerceChrome(category);
  const { items, addItem, setQty, ready } = useCart(tenantSlug);
  const [justAdded, setJustAdded] = useState(false);
  const bg = solidCtaColor(accent);
  const fg = ctaTextColor(bg);

  const inCart = items.find((item) => item.productId === product.id);
  const Icon = chrome.mode === "service" ? MessageCircle : ShoppingBag;

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: Number(product.price),
      image: product.image,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  if (!inCart) {
    return (
      <div className="mt-8 w-full md:max-w-md">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!ready}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          style={{ backgroundColor: bg, color: fg }}
        >
          <Icon className="h-5 w-5" />
          {ready ? chrome.addLabel : "Loading…"}
        </button>
        {chrome.ctaHint ? (
          <p className="mt-2 text-center text-xs text-neutral-500">{chrome.ctaHint}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-8 flex w-full flex-col gap-3 md:max-w-md">
      <div className="flex items-center justify-between rounded-full border border-neutral-200 p-1.5">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty(product.id, inCart.qty - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 transition hover:bg-neutral-200"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-base font-semibold">
          {justAdded ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <Check className="h-4 w-4" /> Added
            </span>
          ) : (
            chrome.inCartLabel(inCart.qty)
          )}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty(product.id, inCart.qty + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full transition hover:opacity-90"
          style={{ backgroundColor: bg, color: fg }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Link
        href={`/${tenantSlug}/checkout`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold shadow-sm transition hover:opacity-90"
        style={{ backgroundColor: bg, color: fg }}
      >
        {chrome.checkoutLabel}
      </Link>
    </div>
  );
}
