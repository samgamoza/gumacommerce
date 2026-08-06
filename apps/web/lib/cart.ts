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

function normalizeItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const productId = typeof item.productId === "string" ? item.productId : null;
  const slug = typeof item.slug === "string" ? item.slug : "";
  const title = typeof item.title === "string" ? item.title : "";
  const image = typeof item.image === "string" ? item.image : "";
  const price = Number(item.price);
  const qty = Number(item.qty);
  if (!productId || !Number.isFinite(price) || price < 0) return null;
  if (!Number.isFinite(qty) || qty < 1) return null;
  return {
    productId,
    slug,
    title,
    image,
    price,
    qty: Math.min(Math.floor(qty), 99),
  };
}

function readCart(tenantSlug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(tenantSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem).filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

function writeCart(tenantSlug: string, items: CartItem[]): void {
  try {
    window.localStorage.setItem(storageKey(tenantSlug), JSON.stringify(items));
  } catch {
    // Private mode / quota — still update in-memory via the event below.
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { tenantSlug, items } }));
}

export function useCart(tenantSlug: string) {
  const [items, setItems] = useState<CartItem[]>([]);
  // Cart loads after mount (localStorage), so consumers can avoid hydration mismatch.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart(tenantSlug));
    setReady(true);

    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ tenantSlug?: string; items?: CartItem[] }>).detail;
      if (detail?.tenantSlug && detail.tenantSlug !== tenantSlug) return;
      if (detail?.items && Array.isArray(detail.items)) {
        setItems(detail.items);
        return;
      }
      setItems(readCart(tenantSlug));
    };
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [tenantSlug]);

  const addItem = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      const price = Number(item.price);
      if (!item.productId || !Number.isFinite(price)) return;

      const normalized = {
        ...item,
        price,
        image: item.image || "",
        slug: item.slug || "",
        title: item.title || "Product",
      };

      const current = readCart(tenantSlug);
      const existing = current.find((entry) => entry.productId === normalized.productId);
      const next = existing
        ? current.map((entry) =>
            entry.productId === normalized.productId
              ? { ...entry, qty: Math.min(entry.qty + qty, 99) }
              : entry
          )
        : [...current, { ...normalized, qty: Math.min(Math.max(1, qty), 99) }];

      // Optimistic UI update — don't wait only on the CustomEvent round-trip.
      setItems(next);
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
      setItems(next);
      writeCart(tenantSlug, next);
    },
    [tenantSlug]
  );

  const removeItem = useCallback(
    (productId: string) => setQty(productId, 0),
    [setQty]
  );

  const clear = useCallback(() => {
    setItems([]);
    writeCart(tenantSlug, []);
  }, [tenantSlug]);

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return { items, ready, addItem, setQty, removeItem, clear, count, subtotal };
}
