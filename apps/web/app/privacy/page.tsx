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
  title: "Privacy Policy — Guma Commerce",
  description:
    "How Guma Commerce collects, uses, and protects personal data under the Philippine Data Privacy Act.",
};

const toc = [
  { id: "dpa", label: "1. DPA compliance" },
  { id: "collect", label: "2. Information we collect" },
  { id: "use", label: "3. How we use data" },
  { id: "sharing", label: "4. Data sharing" },
  { id: "rights", label: "5. Your rights" },
  { id: "retention", label: "6. Retention" },
  { id: "security", label: "7. Security" },
  { id: "dpo", label: "8. Contact DPO" },
];

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Privacy policy" }]} />
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description={`How ${company.product} handles personal information for sellers and shoppers.`}
        meta={`Last updated: August 6, 2026 · ${company.name}`}
      />

      <LegalDocLayout toc={toc}>
        <p>
          This Privacy Policy explains how {company.product} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) collects, uses, discloses, and protects personal information when you
          use our platform, in compliance with the{" "}
          <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> and issuances of the
          National Privacy Commission (NPC).
        </p>

        <h2 id="dpa">1. Data Privacy Act compliance</h2>
        <p>
          We act as a Personal Information Controller (PIC) for seller account data and as a
          processor for end-customer order data on behalf of sellers. We implement organizational,
          physical, and technical security measures consistent with NPC guidance.
        </p>

        <h2 id="collect">2. Information we collect</h2>
        <ul>
          <li>
            <strong>Seller accounts:</strong> Name, email, phone, business details, and receiving
            account details you enter for GCash / Maya / bank (manual payout path)
          </li>
          <li>
            <strong>Customer orders:</strong> Name, phone, delivery address, and order details
            (collected on behalf of sellers)
          </li>
          <li>
            <strong>Payment data:</strong> For manual e-wallet checkout, we store payment references
            and optional proof you or the buyer uploads. When PayMongo gateway mode is enabled with
            live keys, card/e-wallet processing is handled by that partner — we do not store full
            card numbers
          </li>
          <li>
            <strong>Support tickets:</strong> Name, email, and message content you submit via Contact
            or seller Help &amp; support
          </li>
          <li>
            <strong>Usage data:</strong> IP address, device type, pages visited, UTM/referral sources
          </li>
        </ul>

        <h2 id="use">3. How we use your information</h2>
        <ul>
          <li>Provide and improve the Guma Commerce platform</li>
          <li>Process orders, payment confirmation workflows, and delivery booking</li>
          <li>Send transactional SMS/email when those integrations are configured</li>
          <li>Generate AI-assisted content only when you request it</li>
          <li>Operate platform helpdesk and respond to support requests</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2 id="sharing">4. Data sharing</h2>
        <p>We share data only as needed with:</p>
        <ul>
          <li>Payment partners (e.g. PayMongo) when gateway mode is enabled</li>
          <li>Delivery partners (e.g. Lalamove, Grab Express) when you book a courier</li>
          <li>SMS providers (e.g. Semaphore) when notifications are configured</li>
          <li>Email providers (e.g. Resend) for transactional and helpdesk mail</li>
          <li>Cloud infrastructure providers (e.g. Neon, Vercel)</li>
          <li>Law enforcement when required by Philippine law</li>
        </ul>

        <h2 id="rights">5. Your rights (Data Subject Rights)</h2>
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
          <a href={`mailto:${company.privacy}`}>{company.privacy}</a>.
        </p>

        <h2 id="retention">6. Data retention</h2>
        <p>
          Order records are retained for 7 years for tax and legal compliance. Account data is kept
          while your account is active and deleted within 90 days of closure, unless law requires
          longer retention.
        </p>

        <h2 id="security">7. Security</h2>
        <p>
          We use TLS encryption, access controls, audit logging, and regular security reviews. In
          the event of a personal data breach that meets notification thresholds, we will notify
          affected users and the NPC as required by law.
        </p>

        <h2 id="dpo">8. Contact our Data Protection Officer</h2>
        <p>
          Email: <a href={`mailto:${company.privacy}`}>{company.privacy}</a>
          <br />
          Address: {company.address}
        </p>
        <p className="!mt-8 text-sm">
          See also our <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/refunds">Refund Policy</Link>.
        </p>
      </LegalDocLayout>
    </MarketingShell>
  );
}
