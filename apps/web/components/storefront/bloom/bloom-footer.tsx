"use client";

import Link from "next/link";
import { Heart, Mail } from "lucide-react";
import type { DemoTenant } from "@/lib/demo-data";

export function BloomFooter({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--bloom-border)] bg-[var(--bloom-bg)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-[var(--bloom-border)] py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold">Stay in the loop</h3>
            <p className="mt-2 text-muted-foreground">
              {tenant.shopTheme.promoSubtitle ||
                `Get updates on new arrivals and exclusive offers from ${tenant.name}.`}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" style={{ color: primary }} />
              Message us after checkout — we&apos;ll add you to our list.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 py-12 md:grid-cols-2">
          <div>
            <Link href={homeHref} className="text-2xl font-semibold tracking-tight text-gray-900">
              {tenant.name}
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {tenant.tagline || tenant.shopTheme.tagline}
            </p>
            {tenant.location && (
              <p className="mt-4 text-sm text-muted-foreground">{tenant.location}</p>
            )}
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={homeHref} className="hover:text-gray-900">
                  All products
                </Link>
              </li>
              <li>
                <Link href={checkoutHref} className="hover:text-gray-900">
                  Cart & checkout
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--bloom-border)] py-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <span>
              © {year} {tenant.name}. Made with
            </span>
            <Heart className="h-4 w-4 fill-current text-red-500" />
          </div>
          <p>
            Powered by <span className="font-semibold text-gray-800">Guma One</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
