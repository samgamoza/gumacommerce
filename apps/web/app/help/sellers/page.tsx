import type { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { adminUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Seller Guide — Guma One Help",
  description: "Step-by-step guide to launching your Guma One social commerce shop.",
};

export default function SellerGuidePage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Help center", href: "/help" }, { label: "Seller guide" }]} />
      <PageHeader
        eyebrow="Seller guide"
        title="Launch your shop in 5 steps"
        description="From signup to your first order — a quick start for Philippine social sellers."
      />

      <ContentSection>
        <h2>Step 1: Create your account</h2>
        <p>
          Sign up at the{" "}
          <Link href={`${adminUrl}/signup`} className="text-primary hover:underline">
            seller signup page
          </Link>
          . Verify your email and phone number. Choose your shop slug (e.g., haloqueen →
          haloqueen.gumacommerce.ph).
        </p>

        <h2>Step 2: Add your products</h2>
        <p>
          Add products manually or use the AI Content Studio to generate listings from a simple
          description. Include clear photos, prices in PHP, and variants (size, flavor, etc.).
        </p>

        <h2>Step 3: Connect payments</h2>
        <p>
          Complete PayMongo onboarding to accept GCash, Maya, QRPh, and cards. Enable COD if you
          serve local customers who prefer cash on delivery.
        </p>

        <h2>Step 4: Set up delivery</h2>
        <p>
          Add your pickup address for Lalamove quotes. Test a delivery quote from your shop to a
          nearby address. Configure free delivery thresholds if desired.
        </p>

        <h2>Step 5: Share your Order Now link</h2>
        <p>
          Copy your shop link and paste it in your Instagram bio, Facebook page, TikTok profile, and
          every post. Use AI Studio to generate captions with the link already included.
        </p>

        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <p className="font-display font-semibold text-foreground">Pro tip</p>
          <p className="mt-2 text-sm">
            Add <code className="rounded bg-background px-1.5 py-0.5 text-xs">?utm_source=instagram</code>{" "}
            to track which platform drives the most orders in your analytics dashboard.
          </p>
        </div>
      </ContentSection>
    </MarketingShell>
  );
}
