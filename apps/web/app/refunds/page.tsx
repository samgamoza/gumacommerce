import type { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  LegalDocLayout,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { company } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Refund & Return Policy — Guma Commerce",
  description: "Refund and return policies for Guma Commerce platform fees and seller storefronts.",
};

const toc = [
  { id: "subscription", label: "Platform fees" },
  { id: "seller", label: "Seller-to-buyer" },
  { id: "payments", label: "Payment refunds" },
  { id: "cod", label: "COD orders" },
  { id: "disputes", label: "Disputes" },
];

export default function RefundsPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Refund policy" }]} />
      <PageHeader
        eyebrow="Legal"
        title="Refund & Return Policy"
        description="How platform fees and seller-to-buyer returns are handled."
        meta={`Last updated: August 6, 2026 · ${company.name}`}
      />

      <LegalDocLayout toc={toc}>
        <h2 id="subscription">Platform subscription refunds</h2>
        <p>
          Guma Commerce subscription fees (Pro, Advance) are non-refundable for the current billing
          period. You may cancel anytime to prevent future charges. If you were charged in error,
          contact{" "}
          <a href={`mailto:${company.support}`}>{company.support}</a> within 7 days.
        </p>

        <h2 id="seller">Seller-to-customer refunds</h2>
        <p>
          Refunds for product orders are the responsibility of the individual seller. Sellers must
          publish their own return/refund policy on their storefront as required by the Internet
          Transactions Act (RA 11967).
        </p>
        <p>A good seller policy usually covers:</p>
        <ul>
          <li>Return window (e.g., 24 hours for food, 7 days for goods)</li>
          <li>Condition of returned items</li>
          <li>Refund method (original payment or store credit)</li>
          <li>Who pays return shipping</li>
        </ul>

        <h2 id="payments">Payment refunds (GCash, Maya, cards)</h2>
        <p>
          <strong>Manual e-wallet path:</strong> buyers pay the seller directly. Refunds are arranged
          between seller and buyer (transfer back to the original e-wallet or bank account).
        </p>
        <p>
          <strong>PayMongo gateway path</strong> (when enabled with live keys): refunds are processed
          through the payment partner back to the customer&apos;s original method. Timing typically
          takes 3–7 business days depending on the provider.
        </p>

        <h2 id="cod">COD orders</h2>
        <p>
          Cash on Delivery orders that were not accepted may be cancelled without charge. If goods
          were delivered and are defective, the seller must arrange resolution directly with the
          customer.
        </p>

        <h2 id="disputes">Disputes</h2>
        <p>
          For unresolved disputes, customers may file a complaint with the DTI via{" "}
          <a href="https://www.dti.gov.ph" target="_blank" rel="noopener noreferrer">
            www.dti.gov.ph
          </a>{" "}
          or contact Guma Commerce support at{" "}
          <a href={`mailto:${company.support}`}>{company.support}</a> for platform assistance.
        </p>

        <p className="!mt-8 text-sm">
          See also our <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalDocLayout>
    </MarketingShell>
  );
}
