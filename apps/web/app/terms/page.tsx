import type { Metadata } from "next";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { company } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Terms of Service — Guma Commerce",
  description: "Terms and conditions for using the Guma Commerce social commerce platform.",
};

export default function TermsPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Terms of service" }]} />
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description={`Last updated: July 3, 2026 · ${company.name}`}
      />

      <ContentSection>
        <h2>1. Agreement</h2>
        <p>
          By accessing or using {company.product}, you agree to these Terms of Service and our
          Privacy Policy. If you do not agree, do not use the platform.
        </p>

        <h2>2. Platform description</h2>
        <p>
          Guma Commerce provides social commerce tools including storefront hosting, payment processing
          integration, delivery booking, and AI content generation for sellers in the Philippines.
        </p>

        <h2>3. Seller responsibilities</h2>
        <ul>
          <li>Provide accurate product descriptions, prices, and availability</li>
          <li>Fulfill orders promptly and communicate delays to customers</li>
          <li>Comply with DTI, BIR, FDA, and other applicable regulations for your product category</li>
          <li>Not sell prohibited or counterfeit goods</li>
          <li>Maintain valid payout account information</li>
        </ul>

        <h2>4. Fees and billing</h2>
        <p>
          Subscription fees and per-order platform fees are disclosed at signup and on our Pricing
          page. Payment gateway fees are charged separately by our licensed partners. Fees may change
          with 30 days notice.
        </p>

        <h2>5. Internet Transactions Act (RA 11967)</h2>
        <p>
          Sellers using Guma Commerce must display their business identity, contact information, and
          return/refund policies on their storefront as required by RA 11967 and DTI guidelines.
        </p>

        <h2>6. Intellectual property</h2>
        <p>
          Guma Commerce owns the platform, branding, and software. Sellers retain ownership of their
          product content, images, and brand materials. AI-generated content is licensed to sellers
          for commercial use on their shops and social media.
        </p>

        <h2>7. Limitation of liability</h2>
        <p>
          Guma Commerce is a technology platform. We are not a party to transactions between sellers and
          buyers. We are not liable for product quality, delivery failures by third-party couriers,
          or payment disputes beyond our platform obligations.
        </p>

        <h2>8. Termination</h2>
        <p>
          Either party may terminate at any time. We may suspend accounts that violate these terms,
          engage in fraud, or receive repeated customer complaints.
        </p>

        <h2>9. Governing law</h2>
        <p>
          These terms are governed by the laws of the Republic of the Philippines. Disputes shall be
          resolved in courts of Taguig City, Metro Manila.
        </p>

        <h2>10. Contact</h2>
        <p>
          {company.email} · {company.address}
        </p>
      </ContentSection>
    </MarketingShell>
  );
}
