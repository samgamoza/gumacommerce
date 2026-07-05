"use client";

import { useCallback, useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  qty: number;
}

const CART_EVENT = "guma-cart-change";

function storageKey(tenantSlug: string): string {
  return `guma-cart:${tenantSlug}`;
}

function readCart(tenantSlug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(tenantSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item?.productId === "string" &&
        typeof item?.price === "number" &&
        Number.isInteger(item?.qty) &&
        item.qty > 0
    );
  } catch {
    return [];
  }
}

function writeCart(tenantSlug: string, items: CartItem[]): void {
  window.localStorage.setItem(storageKey(tenantSlug), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { tenantSlug } }));
}

export function useCart(tenantSlug: string) {
  const [items, setItems] = useState<CartItem[]>([]);
  // Cart loads after mount (localStorage), so consumers can avoid hydration mismatch.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart(tenantSlug));
    setReady(true);

    const sync = () => setItems(readCart(tenantSlug));
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [tenantSlug]);

  const addItem = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      const current = readCart(tenantSlug);
      const existing = current.find((entry) => entry.productId === item.productId);
      const next = existing
        ? current.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, qty: Math.min(entry.qty + qty, 99) }
              : entry
          )
        : [...current, { ...item, qty: Math.min(qty, 99) }];
      writeCart(tenantSlug, next);
    },
    [tenantSlug]
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      const current = readCart(tenantSlug);
      const next =
        qty <= 0
          ? current.filter((entry) => entry.productId !== productId)
          : current.map((entry) =>
              entry.productId === productId ? { ...entry, qty: Math.min(qty, 99) } : entry
            );
      writeCart(tenantSlug, next);
    },
    [tenantSlug]
  );

  const removeItem = useCallback(
    (productId: string) => setQty(productId, 0),
    [setQty]
  );

  const clear = useCallback(() => writeCart(tenantSlug, []), [tenantSlug]);

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return { items, ready, addItem, setQty, removeItem, clear, count, subtotal };
}
