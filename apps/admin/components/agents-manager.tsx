"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  CalendarClock,
  Check,
  Copy,
  MessageSquare,
  Play,
  Sparkles,
} from "lucide-react";
import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { Button, Card } from "@guma-commerce/ui";
import type {
  AgentSettings,
  ContentQueueItem,
  OrderInsights7d,
  ShopAssistantSettings,
} from "@guma-commerce/db";
import type { AiUsageSnapshot } from "@guma-commerce/ai";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  scheduled: "bg-violet-100 text-violet-800",
  posted: "bg-emerald-100 text-emerald-800",
  skipped: "bg-gray-100 text-gray-600",
};

export function AgentsManager({ embedded = false }: { embedded?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentSettings | null>(null);
  const [shopAssistant, setShopAssistant] = useState<ShopAssistantSettings | null>(null);
  const [queue, setQueue] = useState<ContentQueueItem[]>([]);
  const [queueCalendar, setQueueCalendar] = useState<
    Array<{ dateKey: string; label: string; items: ContentQueueItem[] }>
  >([]);
  const [usage, setUsage] = useState<AiUsageSnapshot | null>(null);
  const [briefing, setBriefing] = useState<{
    headline: string;
    subheadline: string;
    insights: string[];
    bestPostTime: string;
    queueSummary: { draft: number; approved: number; scheduled: number; posted: number };
    suggestedActions: string[];
  } | null>(null);
  const [orderInsights, setOrderInsights] = useState<OrderInsights7d | null>(null);
  const [models, setModels] = useState<Record<string, string>>({});
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [message, setMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/agents");
    const data = await res.json();
    setLoading(false);
    if (data.ok) {
      setAgents(data.agents);
      setShopAssistant(data.shopAssistant);
      setQueue(data.queue ?? []);
      setQueueCalendar(data.queueCalendar ?? []);
      setUsage(data.usage ?? null);
      setBriefing(data.briefing ?? null);
      setOrderInsights(data.orderInsights ?? null);
      setModels(data.models ?? {});
      setSubscriptionPlan(data.subscriptionPlan ?? "free");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runAgent(agentKey: "posting" | "campaign" | "all") {
    setRunning(agentKey);
    setMessage(null);
    const res = await fetch("/api/agents/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentKey }),
    });
    const data = await res.json();
    setRunning(null);
    if (data.ok) {
      setMessage(`Created ${data.itemsCreated} queue item(s).`);
      await load();
    } else {
      setMessage(
        data.upgradeRequired
          ? `${data.error} Upgrade your plan in Settings → Subscription.`
          : (data.error ?? "Run failed.")
      );
    }
  }

  async function saveConfig(patch: {
    agents?: Partial<AgentSettings>;
    shopAssistant?: Partial<ShopAssistantSettings>;
  }) {
    const res = await fetch("/api/agents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.ok) {
      setMessage("Settings saved.");
      await load();
    }
  }

  async function updateQueueStatus(id: string, status: "approved" | "posted" | "skipped") {
    await fetch("/api/agents/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function copyBody(item: ContentQueueItem) {
    await navigator.clipboard.writeText(item.body);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    const loadingBody = <p className="text-gray-500">Loading agent workspace…</p>;
    if (embedded) return loadingBody;
    return <PatternAdminShell title="Agents">{loadingBody}</PatternAdminShell>;
  }

  const body = (
    <>
      <div className="mb-6 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-950 via-indigo-950 to-black p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              GUMA Workspace · Automations
            </p>
            <h2 className="mt-2 text-2xl font-bold">Daily & weekly automation</h2>
            <p className="mt-2 max-w-2xl text-sm text-violet-100/90">
              Agents draft posts and campaigns into your queue. Approve, copy to social, then mark
              posted. Your shop assistant handles buyer questions on the storefront.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!!running}
              onClick={() => runAgent("posting")}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {running === "posting" ? "Running…" : "Run daily posts"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!!running}
              onClick={() => runAgent("campaign")}
            >
              <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
              {running === "campaign" ? "Running…" : "Run weekly campaign"}
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {briefing && (
        <Card className="mb-6 border-violet-100 bg-gradient-to-br from-white to-violet-50/40 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
                Daily briefing · {subscriptionPlan} plan
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{briefing.headline}</h2>
              <p className="mt-1 text-sm text-gray-600">{briefing.subheadline}</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-violet-100">
              <p className="font-medium text-gray-900">Best post time</p>
              <p className="text-violet-700">{briefing.bestPostTime}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            {briefing.insights.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {briefing.suggestedActions.map((action) => (
              <span
                key={action}
                className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-900"
              >
                {action}
              </span>
            ))}
          </div>
        </Card>
      )}

      {usage && (
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <UsageMeter
            label="Agent runs (week)"
            used={usage.agentRunsThisWeek}
            limit={usage.limits.agentRunsPerWeek}
          />
          <UsageMeter
            label="Chat replies (today)"
            used={usage.chatMessagesToday}
            limit={usage.limits.chatMessagesPerDay}
          />
          <UsageMeter
            label="AI generations (month)"
            used={usage.generationsThisMonth}
            limit={usage.limits.generationsPerMonth}
          />
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Models</p>
            <p className="mt-2 text-sm text-gray-800">Posts: {models.agentPost ?? "—"}</p>
            <p className="text-sm text-gray-800">Campaign: {models.agentCampaign ?? "—"}</p>
            <p className="text-sm text-gray-800">Chat: {models.chat ?? "—"}</p>
          </Card>
        </div>
      )}

      {orderInsights && (
        <Card className="mb-6 p-5">
          <h3 className="font-semibold">Shop pulse (7 days)</h3>
          <p className="mt-2 text-sm text-gray-600">
            {orderInsights.orderCount} orders · ₱
            {orderInsights.revenue.toLocaleString("en-PH")} revenue · trend{" "}
            {orderInsights.trend === "up" ? "📈 up" : orderInsights.trend === "down" ? "📉 down" : "→ flat"}
          </p>
        </Card>
      )}

      {queueCalendar.length > 0 && (
        <Card className="mb-6 p-5">
          <h3 className="font-semibold">Content calendar</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {queueCalendar.map((day) => (
              <div key={day.dateKey} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">{day.label}</p>
                <ul className="mt-2 space-y-2">
                  {day.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="text-xs text-gray-600">
                      <span className="font-medium capitalize">{item.platform}</span> ·{" "}
                      {item.title ?? item.body.slice(0, 40)}…
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h3 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-violet-600" />
            Schedule
          </h3>
          {agents && (
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agents.postingEnabled}
                  onChange={(e) =>
                    saveConfig({ agents: { ...agents, postingEnabled: e.target.checked } })
                  }
                />
                Daily posting agent
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agents.campaignEnabled}
                  onChange={(e) =>
                    saveConfig({ agents: { ...agents, campaignEnabled: e.target.checked } })
                  }
                />
                Weekly campaign agent
              </label>
              <label className="block">
                <span className="mb-1 block text-gray-600">Cadence</span>
                <select
                  className="h-10 w-full rounded-xl border border-gray-200 px-3"
                  value={agents.postingSchedule}
                  onChange={(e) =>
                    saveConfig({
                      agents: {
                        ...agents,
                        postingSchedule: e.target.value as AgentSettings["postingSchedule"],
                      },
                    })
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual only</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-gray-600">Run time (PHT)</span>
                <input
                  type="time"
                  className="h-10 w-full rounded-xl border border-gray-200 px-3"
                  value={agents.postingTime}
                  onChange={(e) =>
                    saveConfig({ agents: { ...agents, postingTime: e.target.value } })
                  }
                />
              </label>
              <p className="text-xs text-gray-500">
                Cron: <code>/api/cron/agents</code> (daily/weekly) ·{" "}
                <code>/api/cron/agent-reminders</code> (5 PM PHT SMS on Pro+)
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-1">
          <h3 className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            Shop assistant (buyers)
          </h3>
          {shopAssistant && (
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shopAssistant.enabled}
                  onChange={(e) =>
                    saveConfig({
                      shopAssistant: { ...shopAssistant, enabled: e.target.checked },
                    })
                  }
                />
                Show chatbot on storefront
              </label>
              <label className="block">
                <span className="mb-1 block text-gray-600">Assistant name</span>
                <input
                  className="h-10 w-full rounded-xl border border-gray-200 px-3"
                  value={shopAssistant.name}
                  onChange={(e) =>
                    setShopAssistant({ ...shopAssistant, name: e.target.value })
                  }
                  onBlur={() => saveConfig({ shopAssistant })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-gray-600">Greeting</span>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  rows={3}
                  value={shopAssistant.greeting}
                  onChange={(e) =>
                    setShopAssistant({ ...shopAssistant, greeting: e.target.value })
                  }
                  onBlur={() => saveConfig({ shopAssistant })}
                />
              </label>
              <p className="text-xs text-gray-500">
                Answers product, delivery, and payment questions before checkout.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-1">
          <h3 className="flex items-center gap-2 font-semibold">
            <Bot className="h-4 w-4 text-indigo-600" />
            Channels
          </h3>
          {agents && (
            <div className="mt-4 space-y-2 text-sm">
              {(["instagram", "tiktok", "facebook"] as const).map((channel) => (
                <label key={channel} className="flex items-center gap-2 capitalize">
                  <input
                    type="checkbox"
                    checked={agents.channels.includes(channel)}
                    onChange={(e) => {
                      const channels = e.target.checked
                        ? [...agents.channels, channel]
                        : agents.channels.filter((c) => c !== channel);
                      saveConfig({ agents: { ...agents, channels } });
                    }}
                  />
                  {channel}
                </label>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h3 className="font-semibold">Content queue</h3>
        <p className="mt-1 text-sm text-gray-500">
          Review agent drafts, copy to your social apps, then mark as posted.
        </p>

        {queue.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
            Queue is empty. Run an agent to generate drafts.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {queue.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        {PLATFORM_LABEL[item.platform] ?? item.platform}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status]}`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-400">{item.agentKey} agent</span>
                    </div>
                    {item.title && (
                      <p className="mt-2 font-medium text-gray-900">{item.title}</p>
                    )}
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.body}</p>
                    {item.mediaBrief && (
                      <p className="mt-2 text-xs text-gray-500">Visual: {item.mediaBrief}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => copyBody(item)}>
                      {copiedId === item.id ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </Button>
                    {item.status === "draft" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateQueueStatus(item.id, "approved")}
                      >
                        Approve
                      </Button>
                    )}
                    {item.status !== "posted" && item.status !== "skipped" && (
                      <>
                        <Button size="sm" onClick={() => updateQueueStatus(item.id, "posted")}>
                          Mark posted
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQueueStatus(item.id, "skipped")}
                        >
                          Skip
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );

  if (embedded) return body;
  return <PatternAdminShell title="Agents">{body}</PatternAdminShell>;
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-gray-900">
        {used} / {limit >= 999 ? "∞" : limit}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-violet-600" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}
