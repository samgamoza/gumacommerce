"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin } from "lucide-react";
import { GumaMark } from "@guma-commerce/ui";
import { company, footerLinks } from "@/lib/site-content";
import { adminUrl } from "@/lib/utils";

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  const pathname = usePathname() ?? "/";
  const onFrontend1Preview = pathname === "/frontend1" || pathname.startsWith("/frontend1/");
  const home = onFrontend1Preview ? "/frontend1" : "/";
  const featuresHref = onFrontend1Preview ? "/frontend1#features" : "/#features";

  const productLinks = footerLinks.product.map((link) =>
    link.label === "Features" ? { ...link, href: featuresHref } : link
  );

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href={home} className="flex items-center gap-2.5">
              <GumaMark className="h-9 w-9 drop-shadow-sm" />
              <span className="font-display text-xl font-bold tracking-tight">
                Guma<span className="text-gradient">Commerce</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The social commerce platform built for Philippine sellers. Turn posts into orders
              with AI, local payments, and delivery.
            </p>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              <a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4 shrink-0" />
                {company.email}
              </a>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {company.address}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="text-sm text-muted-foreground transition hover:text-primary"
              >
                Contact us
              </Link>
            </div>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Company" links={footerLinks.company} />
          <FooterColumn title="Support" links={footerLinks.support} />
          <FooterColumn title="Legal" links={footerLinks.legal} />
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <div className="text-center text-xs text-muted-foreground sm:text-left">
            <p>
              © {new Date().getFullYear()} {company.name}. All rights reserved.
            </p>
            <p className="mt-1">{company.registry}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/refunds" className="hover:text-primary">
              Refunds
            </Link>
            <Link href={`${adminUrl}/login`} className="hover:text-primary">
              Seller portal
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground/80">
          Guma One complies with the Philippine Data Privacy Act (RA 10173), Internet Transactions
          Act (RA 11967), and DTI e-commerce guidelines. Payment processing via BSP-regulated
          partners.
        </p>
      </div>
    </footer>
  );
}
