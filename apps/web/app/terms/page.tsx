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
  title: "Terms of Service — Guma Commerce",
  description: "Terms and conditions for using the Guma Commerce social commerce platform.",
};

const toc = [
  { id: "agreement", label: "1. Agreement" },
  { id: "platform", label: "2. Platform" },
  { id: "seller", label: "3. Seller duties" },
  { id: "fees", label: "4. Fees" },
  { id: "ita", label: "5. RA 11967" },
  { id: "ip", label: "6. IP" },
  { id: "liability", label: "7. Liability" },
  { id: "termination", label: "8. Termination" },
  { id: "law", label: "9. Governing law" },
  { id: "contact", label: "10. Contact" },
];

export default function TermsPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Terms of service" }]} />
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description={`The rules for using ${company.product} as a seller or visitor.`}
        meta={`Last updated: August 6, 2026 · ${company.name}`}
      />

      <LegalDocLayout toc={toc}>
        <h2 id="agreement">1. Agreement</h2>
        <p>
          By accessing or using {company.product}, you agree to these Terms of Service and our{" "}
          <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the platform.
        </p>

        <h2 id="platform">2. Platform description</h2>
        <p>
          Guma Commerce provides social commerce tools for Philippine sellers, including branded
          storefront hosting, guest checkout, seller messaging, optional payment-gateway
          integration when configured, courier booking / rider assignment, and optional AI
          assistants. Features available to you depend on your plan and which integrations are
          enabled with valid credentials.
        </p>

        <h2 id="seller">3. Seller responsibilities</h2>
        <ul>
          <li>Provide accurate product descriptions, prices, and availability</li>
          <li>Fulfill orders promptly and communicate delays to customers</li>
          <li>
            Comply with DTI, BIR, FDA, and other applicable regulations for your product category
          </li>
          <li>Not sell prohibited or counterfeit goods</li>
          <li>
            Maintain accurate receiving details for manual e-wallet checkout, or valid gateway
            onboarding when using PayMongo mode
          </li>
          <li>
            Confirm payments carefully when using the manual e-wallet path — you are responsible for
            verifying transfers before fulfilling
          </li>
        </ul>

        <h2 id="fees">4. Fees and billing</h2>
        <p>
          Subscription fees (Free / Pro / Advance) and any per-order platform fees are disclosed at
          signup and on our <Link href="/pricing">Pricing</Link> page. Payment gateway fees, when
          applicable, are charged by the payment partner. Fees may change with 30 days notice.
        </p>

        <h2 id="ita">5. Internet Transactions Act (RA 11967)</h2>
        <p>
          Sellers using Guma Commerce must display their business identity, contact information, and
          return/refund policies on their storefront as required by RA 11967 and DTI guidelines.
        </p>

        <h2 id="ip">6. Intellectual property</h2>
        <p>
          Guma Commerce owns the platform, branding, and software. Sellers retain ownership of their
          product content, images, and brand materials. AI-generated content created at your request
          is licensed to you for commercial use on your shops and social media.
        </p>

        <h2 id="liability">7. Limitation of liability</h2>
        <p>
          Guma Commerce is a technology platform. We are not a party to transactions between sellers
          and buyers. We are not liable for product quality, delivery failures by third-party
          couriers, or payment disputes beyond our platform obligations — including disputes arising
          from seller-confirmed manual e-wallet payments.
        </p>

        <h2 id="termination">8. Termination</h2>
        <p>
          Either party may terminate at any time. We may suspend accounts that violate these terms,
          engage in fraud, or receive repeated customer complaints. Suspended shops are blocked from
          new checkout and seller write actions until reactivated.
        </p>

        <h2 id="law">9. Governing law</h2>
        <p>
          These terms are governed by the laws of the Republic of the Philippines. Disputes shall be
          resolved in courts of Metro Manila, Philippines.
        </p>

        <h2 id="contact">10. Contact</h2>
        <p>
          <a href={`mailto:${company.email}`}>{company.email}</a> · {company.address}
        </p>
        <p className="!mt-8 text-sm">
          Related: <Link href="/privacy">Privacy Policy</Link> ·{" "}
          <Link href="/refunds">Refund Policy</Link> · <Link href="/contact">Contact</Link>
        </p>
      </LegalDocLayout>
    </MarketingShell>
  );
}
