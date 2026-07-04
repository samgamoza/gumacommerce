import type { Metadata } from "next";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { company } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Privacy Policy — Guma Commerce",
  description: "How Guma Commerce collects, uses, and protects your personal data under the Philippine Data Privacy Act.",
};

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Privacy policy" }]} />
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description={`Last updated: July 3, 2026 · ${company.name}`}
      />

      <ContentSection>
        <p>
          This Privacy Policy explains how {company.product} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) collects, uses, discloses, and protects personal information when you
          use our platform, in compliance with the{" "}
          <strong className="text-foreground">Data Privacy Act of 2012 (Republic Act No. 10173)</strong>{" "}
          and issuances of the National Privacy Commission (NPC).
        </p>

        <h2 id="dpa">1. Data Privacy Act compliance</h2>
        <p>
          We act as a Personal Information Controller (PIC) for seller account data and as a
          processor for end-customer order data on behalf of sellers. We implement organizational,
          physical, and technical security measures per NPC Circular No. 2023-06.
        </p>

        <h2>2. Information we collect</h2>
        <ul>
          <li>
            <strong className="text-foreground">Seller accounts:</strong> Name, email, phone, business
            details, bank/e-wallet payout information
          </li>
          <li>
            <strong className="text-foreground">Customer orders:</strong> Name, phone, delivery address,
            order details (collected on behalf of sellers)
          </li>
          <li>
            <strong className="text-foreground">Payment data:</strong> Processed by licensed partners
            (PayMongo/Xendit) — we do not store full card numbers
          </li>
          <li>
            <strong className="text-foreground">Usage data:</strong> IP address, device type, pages
            visited, UTM/referral sources
          </li>
        </ul>

        <h2>3. How we use your information</h2>
        <ul>
          <li>Provide and improve the Guma Commerce platform</li>
          <li>Process orders, payments, and delivery bookings</li>
          <li>Send transactional SMS/email (order confirmations, status updates)</li>
          <li>Generate AI content at your request</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>4. Data sharing</h2>
        <p>We share data only with:</p>
        <ul>
          <li>Payment processors (PayMongo, Xendit)</li>
          <li>Delivery partners (Lalamove)</li>
          <li>SMS providers (Semaphore)</li>
          <li>Cloud infrastructure providers (Neon, Vercel, Cloudflare)</li>
          <li>Law enforcement when required by Philippine law</li>
        </ul>

        <h2>5. Your rights (Data Subject Rights)</h2>
        <p>Under the DPA, you have the right to:</p>
        <ul>
          <li>Be informed of data collection</li>
          <li>Access and obtain a copy of your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Withdraw consent and request deletion (subject to legal retention)</li>
          <li>File a complaint with the NPC</li>
        </ul>
        <p>
          To exercise these rights, email{" "}
          <a href={`mailto:${company.privacy}`} className="text-primary hover:underline">
            {company.privacy}
          </a>
          .
        </p>

        <h2>6. Data retention</h2>
        <p>
          Order records are retained for 7 years for tax and legal compliance. Account data is kept
          while your account is active and deleted within 90 days of closure, unless law requires
          longer retention.
        </p>

        <h2>7. Security</h2>
        <p>
          We use TLS encryption, access controls, audit logging, and regular security reviews. In
          the event of a data breach, we will notify affected users and the NPC within 72 hours as
          required by law.
        </p>

        <h2>8. Contact our Data Protection Officer</h2>
        <p>
          Email:{" "}
          <a href={`mailto:${company.privacy}`} className="text-primary hover:underline">
            {company.privacy}
          </a>
          <br />
          Address: {company.address}
        </p>
      </ContentSection>
    </MarketingShell>
  );
}
