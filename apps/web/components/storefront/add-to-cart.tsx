"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { DemoProduct } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";

export function AddToCartButton({
  tenantSlug,
  product,
  accent,
}: {
  tenantSlug: string;
  product: DemoProduct;
  accent: string;
}) {
  const { items, addItem, setQty, ready } = useCart(tenantSlug);
  const [justAdded, setJustAdded] = useState(false);

  const inCart = items.find((item) => item.productId === product.id);

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
      <button
        type="button"
        onClick={handleAdd}
        disabled={!ready}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70 md:max-w-md"
        style={{ backgroundColor: accent }}
      >
        <ShoppingBag className="h-5 w-5" />
        {ready ? "Add to Cart" : "Loading cart…"}
      </button>
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
            `${inCart.qty} in cart`
          )}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty(product.id, inCart.qty + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Link
        href={`/${tenantSlug}/checkout`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: accent }}
      >
        Checkout now
      </Link>
    </div>
  );
}
