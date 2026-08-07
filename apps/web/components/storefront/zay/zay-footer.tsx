"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { adminUrl, shopPublicUrl, shopPublicUrlLabel } from "@/lib/utils";
import { zayBrandMark } from "./zay-utils";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dedupeCategories(
  categories: Array<{ id: string; name: string; slug: string }>
): Array<{ id: string; name: string; slug: string }> {
  const seen = new Set<string>();
  const unique: Array<{ id: string; name: string; slug: string }> = [];
  for (const cat of categories) {
    const key = cat.slug || cat.id || cat.name;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(cat);
  }
  return unique.slice(0, 6);
}

export function ZayFooter({ tenant }: { tenant: DemoTenant }) {
  const brand = zayBrandMark(tenant.name);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const phone =
    tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
      ? tenant.storeSettings.whatsapp.phone
      : null;
  const siteUrl = shopPublicUrl(tenant.slug);
  const siteLabel = shopPublicUrlLabel(tenant.slug);
  const categories = tenant.shopCategories.length
    ? dedupeCategories(tenant.shopCategories)
    : [...new Set(tenant.products.map((p) => p.category).filter(Boolean))].slice(0, 6).map((name, i) => ({
        id: `cat-${i}-${slugify(name)}`,
        name,
        slug: slugify(name),
      }));

  function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <footer className="zay-footer" id="footer">
      <div className="zay-container">
        <div className="zay-footer-grid">
          <div>
            <h2>
              {brand.primary} {brand.rest}
            </h2>
            <ul className="zay-footer-links">
              <li>{tenant.location}</li>
              {phone && (
                <li>
                  <a href={`tel:${phone}`}>{phone}</a>
                </li>
              )}
              <li>
                <a href={siteUrl} target="_blank" rel="noreferrer">
                  {siteLabel}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="!text-[#cfd6e1]">Products</h2>
            <ul className="zay-footer-links">
              {categories.map((cat, index) => (
                <li key={`${cat.id}-${cat.slug}-${index}`}>
                  <a href="#featured">{cat.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="!text-[#cfd6e1]">Further Info</h2>
            <ul className="zay-footer-links">
              <li>
                <Link href={`/${tenant.slug}`}>Home</Link>
              </li>
              <li>
                <a href="#featured">Shop</a>
              </li>
              <li>
                <Link href={`/${tenant.slug}/checkout`}>Checkout</Link>
              </li>
              <li>
                <a href="#footer">Contact</a>
              </li>
              <li>
                <a href={adminUrl} target="_blank" rel="noreferrer">
                  Seller Dashboard
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          {submitted ? (
            <p className="text-center text-[var(--zay-primary)]">Thanks for subscribing!</p>
          ) : (
            <form onSubmit={handleSubscribe} className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
              <input
                type="email"
                className="flex-1 rounded border border-white/20 bg-transparent px-3 py-2 text-white placeholder:text-white/50"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address"
              />
              <button type="submit" className="zay-btn">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="zay-footer-bar">
        <div className="zay-container">
          <p>
            &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
