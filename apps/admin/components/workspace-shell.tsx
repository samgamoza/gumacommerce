"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bot,
  CheckSquare,
  Lock,
  MessageSquare,
  Search,
  ShoppingCart,
  Sparkles,
  Truck,
  Workflow,
} from "lucide-react";
import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { Button, Card } from "@guma-commerce/ui";
import {
  normalizeAdminPlan,
  planAtLeast,
  upgradeHref,
  type SubscriptionPlan,
} from "@/lib/plan-access";

const MODULES = [
  {
    id: "overview",
    href: "/workspace",
    label: "Overview",
    icon: Workflow,
    description: "Plans, approvals, and activity",
  },
  {
    id: "approvals",
    href: "/workspace/approvals",
    label: "Approvals",
    icon: CheckSquare,
    description: "Diff, approve, publish, rollback",
  },
  {
    id: "seo",
    href: "/workspace/seo",
    label: "SEO",
    icon: Search,
    description: "Meta, social cards, robots",
  },
  {
    id: "checkout",
    href: "/workspace/checkout",
    label: "Checkout",
    icon: ShoppingCart,
    description: "Taxes, coupons, payments",
  },
  {
    id: "shipping",
    href: "/workspace/shipping",
    label: "Shipping",
    icon: Truck,
    description: "Profiles, zones, rates",
  },
  {
    id: "marketing",
    href: "/workspace/marketing",
    label: "Marketing",
    icon: Sparkles,
    description: "Campaigns & content generation",
  },
  {
    id: "automations",
    href: "/workspace/automations",
    label: "Automations",
    icon: Bot,
    description: "Posting agents & schedules",
  },
] as const;

export function WorkspaceShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setPlan(normalizeAdminPlan(data.shop?.tenant?.subscriptionPlan));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const allowed = planAtLeast(plan, "growth");
  const approvalsAlwaysOpen = pathname.startsWith("/workspace/approvals");
  const seoAlwaysOpen = pathname.startsWith("/workspace/seo");
  const checkoutAlwaysOpen = pathname.startsWith("/workspace/checkout");
  const shippingAlwaysOpen = pathname.startsWith("/workspace/shipping");
  const showChildren =
    allowed ||
    approvalsAlwaysOpen ||
    seoAlwaysOpen ||
    checkoutAlwaysOpen ||
    shippingAlwaysOpen ||
    pathname === "/workspace";

  return (
    <PatternAdminShell title={title}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            GUMA Workspace · Paid
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Your AI business operator — suggest, prepare, and automate with{" "}
            <strong>merchant approval</strong> on every significant change.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {MODULES.map((mod) => {
            const active = pathname === mod.href;
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                href={mod.href}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {mod.label}
              </Link>
            );
          })}
        </nav>

        {loading ? (
          <p className="text-sm text-gray-500">Loading workspace…</p>
        ) : !showChildren ? (
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <h2 className="font-semibold text-amber-950">Workspace requires Pro</h2>
                <p className="mt-1 text-sm text-gray-600">
                  GUMA Launch (Free) installs your storefront without AI spend. Workspace unlocks
                  marketing, agents, and multi-step AI plans on Pro (growth) and Advance (pro).
                  Approvals stay available on Free for Launch publish audit.
                </p>
                <Link href={upgradeHref("growth", "workspace")}>
                  <Button className="mt-4">Upgrade to Pro</Button>
                </Link>
                <p className="mt-3 text-xs text-gray-500">
                  Still finishing setup?{" "}
                  <Link href="/launch" className="font-medium text-emerald-700 underline">
                    Continue GUMA Launch
                  </Link>
                  {" · "}
                  <Link href="/workspace/approvals" className="font-medium text-emerald-700 underline">
                    View Approvals
                  </Link>
                </p>
              </div>
            </div>
          </Card>
        ) : (
          children
        )}
      </div>
    </PatternAdminShell>
  );
}

export function WorkspaceOverview() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-700" />
          <h2 className="font-semibold text-gray-900">How Workspace works</h2>
        </div>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-600">
          <li>Describe a business task in natural language (coming soon).</li>
          <li>Review the execution plan and tool timeline.</li>
          <li>Approve diffs — Draft → Preview → Publish.</li>
          <li>Rollback via customization versions when needed.</li>
        </ol>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/workspace/approvals" className="block">
          <Card className="h-full p-5 transition hover:border-emerald-300">
            <CheckSquare className="h-5 w-5 text-emerald-700" />
            <h3 className="mt-2 font-semibold text-gray-900">Approvals</h3>
            <p className="mt-1 text-sm text-gray-600">
              Review diffs, publish, and roll back theme changes with a full audit trail.
            </p>
          </Card>
        </Link>
        <Link href="/workspace/marketing" className="block">
          <Card className="h-full p-5 transition hover:border-emerald-300">
            <Sparkles className="h-5 w-5 text-emerald-700" />
            <h3 className="mt-2 font-semibold text-gray-900">Marketing</h3>
            <p className="mt-1 text-sm text-gray-600">
              Generate campaigns, TikTok packs, and social copy with plan quotas.
            </p>
          </Card>
        </Link>
        <Link href="/workspace/automations" className="block">
          <Card className="h-full p-5 transition hover:border-emerald-300">
            <Bot className="h-5 w-5 text-emerald-700" />
            <h3 className="mt-2 font-semibold text-gray-900">Automations</h3>
            <p className="mt-1 text-sm text-gray-600">
              Schedule posting agents — drafts still need your approval before publish.
            </p>
          </Card>
        </Link>
      </div>

      <Card className="border-dashed p-5">
        <p className="text-sm text-gray-500">
          Phase 3 MVP: modules live here. Full NL orchestration + LangGraph landing in a later
          sprint. Events from Launch/checkout already flow through{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">domain_events</code>.
        </p>
      </Card>
    </div>
  );
}
