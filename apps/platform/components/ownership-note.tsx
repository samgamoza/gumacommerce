/** Compact reminder: what belongs on Platform vs seller admin. */
export function OwnershipNote() {
  return (
    <details className="rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
      <summary className="cursor-pointer font-display font-semibold tracking-tight">
        What belongs here vs seller admin?
      </summary>
      <div className="mt-3 grid gap-4 text-muted-foreground sm:grid-cols-2">
        <div>
          <p className="font-medium text-foreground">Platform (ops) — oversee & intervene</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
            <li>Tenants, plans, users, suspend/activate</li>
            <li>Helpdesk, moderation, KYC/payouts queues (coming)</li>
            <li>Template Intel, landings, Settings, Audit</li>
            <li>Cross-tenant orders + Support access into a shop</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-foreground">Seller admin — run one shop</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
            <li>Products, categories, customers, messages</li>
            <li>Order fulfill / refund for that shop</li>
            <li>Launch look, Workspace AI, automations</li>
            <li>Receiving accounts (GCash/Maya), wallet, WhatsApp, tracking</li>
            <li className="text-amber-800">
              Not PayMongo activation — that stays on Platform
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Seller “Domains / Workflows / Code / API” nav stubs are plan placeholders — not platform ops.
        KYC review and payout approval should move to Platform queues (today they auto/cron on the
        seller side).
      </p>
    </details>
  );
}
