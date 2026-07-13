import type { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { company } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Refund & Return Policy — Guma Commerce",
  description: "Refund and return policies for Guma Commerce platform and seller storefronts.",
};

export default function RefundsPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Refund policy" }]} />
      <PageHeader
        eyebrow="Legal"
        title="Refund & Return Policy"
        description="Guidelines for refunds on platform fees and seller-to-buyer returns."
      />

      <ContentSection>
        <h2>Platform subscription refunds</h2>
        <p>
          Guma Commerce subscription fees (Pro, Advance) are non-refundable for the current billing
          period. You may cancel anytime to prevent future charges. If you were charged in error,
          contact {company.support} within 7 days.
        </p>

        <h2>Seller-to-customer refunds</h2>
        <p>
          Refunds for product orders are the responsibility of the individual seller. Sellers must
          publish their own return/refund policy on their storefront as required by the Internet
          Transactions Act (RA 11967).
        </p>
        <p>Recommended seller policy should cover:</p>
        <ul>
          <li>Return window (e.g., 24 hours for food, 7 days for goods)</li>
          <li>Condition of returned items</li>
          <li>Refund method (original payment or store credit)</li>
          <li>Who pays return shipping</li>
        </ul>

        <h2>Payment refunds (GCash, Maya, cards)</h2>
        <p>
          E-wallet and card refunds are processed through PayMongo/Xendit back to the customer&apos;s
          original payment method. Refunds typically take 3–7 business days depending on the provider.
        </p>

        <h2>COD orders</h2>
        <p>
          Cash on Delivery orders that were not accepted may be cancelled without charge. If goods
          were delivered and are defective, the seller must arrange resolution directly with the
          customer.
        </p>

        <h2>Disputes</h2>
        <p>
          For unresolved disputes, customers may file a complaint with the DTI via{" "}
          <a
            href="https://www.dti.gov.ph"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.dti.gov.ph
          </a>{" "}
          or contact Guma Commerce support at {company.support} for platform assistance.
        </p>

        <p className="mt-8">
          See also our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </ContentSection>
    </MarketingShell>
  );
}
