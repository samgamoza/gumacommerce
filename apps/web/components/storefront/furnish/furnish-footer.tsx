import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";
import { furnishBrandLines } from "./furnish-utils";

export function FurnishFooter({ tenant }: { tenant: DemoTenant }) {
  const brand = furnishBrandLines(tenant.name, tenant.tagline);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const email = tenant.storeSettings.whatsapp.enabled
    ? `${tenant.slug.replace(/-/g, "")}@gumacommerce.app`
    : "hello@example.com";

  return (
    <footer className="furnish-footer">
      <div className="furnish-container">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <Link href={homeHref}>
            <span className="furnish-brand">
              <span>{brand.line1}</span>
              <span>{brand.line2}</span>
            </span>
          </Link>
          <ul className="furnish-footer-links">
            <li>
              <Link href={homeHref}>Home</Link>
            </li>
            <li>
              <a href="#collection">Products</a>
            </li>
            <li>
              <a href="#newsletter">Contact</a>
            </li>
            <li>
              <Link href={checkoutHref}>Cart</Link>
            </li>
          </ul>
        </div>

        <h2 className="furnish-footer-headline">We design all over the world</h2>

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-sm uppercase tracking-wider">Email</span>
            <p className="mt-1 text-2xl font-light text-white">{email}</p>
          </div>
          <a href="#newsletter" className="furnish-btn furnish-btn-outline inline-flex w-fit border-white text-white hover:opacity-90">
            Contact us
          </a>
        </div>

        <div className="furnish-footer-bottom flex flex-col gap-2 text-center md:flex-row md:justify-between md:text-left">
          <p>
            &copy; {new Date().getFullYear()} <strong>{tenant.name}</strong>. All rights reserved.
          </p>
          <p>{tenant.location}</p>
        </div>
      </div>
    </footer>
  );
}
