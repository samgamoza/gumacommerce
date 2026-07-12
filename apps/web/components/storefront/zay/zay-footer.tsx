"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { zayBrandMark } from "./zay-utils";

export function ZayFooter({ tenant }: { tenant: DemoTenant }) {
  const brand = zayBrandMark(tenant.name);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const phone =
    tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
      ? tenant.storeSettings.whatsapp.phone
      : null;
  const contactEmail = `${tenant.slug.replace(/-/g, "")}@gumacommerce.app`;
  const categories = tenant.shopCategories.length
    ? tenant.shopCategories
    : [...new Set(tenant.products.map((p) => ({ id: p.categorySlug ?? p.category, name: p.category, slug: p.categorySlug ?? p.category })))].slice(0, 6);

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
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="!text-[#cfd6e1]">Products</h2>
            <ul className="zay-footer-links">
              {categories.map((cat) => (
                <li key={cat.id}>
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
