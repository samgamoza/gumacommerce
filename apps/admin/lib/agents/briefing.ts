import type { ContentQueueItem, OrderInsights7d } from "@guma-commerce/db";

export interface DailyBriefing {
  headline: string;
  subheadline: string;
  insights: string[];
  bestPostTime: string;
  queueSummary: {
    draft: number;
    approved: number;
    scheduled: number;
    posted: number;
  };
  suggestedActions: string[];
}

export function buildDailyBriefing(
  shopName: string,
  orderInsights: OrderInsights7d,
  queue: ContentQueueItem[]
): DailyBriefing {
  const queueSummary = {
    draft: queue.filter((q) => q.status === "draft").length,
    approved: queue.filter((q) => q.status === "approved").length,
    scheduled: queue.filter((q) => q.status === "scheduled").length,
    posted: queue.filter((q) => q.status === "posted").length,
  };

  const suggestedActions: string[] = [];
  if (queueSummary.draft > 0) {
    suggestedActions.push(`Review ${queueSummary.draft} draft post${queueSummary.draft === 1 ? "" : "s"} and copy to Instagram or TikTok.`);
  } else {
    suggestedActions.push("Run the daily posting agent to fill today's queue.");
  }

  if (orderInsights.suggestedFocus === "slow_week") {
    suggestedActions.push("Highlight a promo or bundle — orders were quiet this week.");
  } else if (orderInsights.topProducts[0]) {
    suggestedActions.push(`Feature "${orderInsights.topProducts[0].title}" — your bestseller this week.`);
  }

  suggestedActions.push("Best engagement window: 6:00–9:00 PM PHT.");

  let headline = `Good day, ${shopName}!`;
  if (orderInsights.orderCount > 0 && orderInsights.trend === "up") {
    headline = `${shopName} is trending up this week 📈`;
  } else if (orderInsights.suggestedFocus === "slow_week") {
    headline = `Let's boost ${shopName} today`;
  }

  return {
    headline,
    subheadline: "Your Guma agent briefing — grounded in real shop data.",
    insights: orderInsights.insightLines,
    bestPostTime: "6:00 PM PHT",
    queueSummary,
    suggestedActions,
  };
}

export function groupQueueByDay(queue: ContentQueueItem[]): Array<{
  dateKey: string;
  label: string;
  items: ContentQueueItem[];
}> {
  const groups = new Map<string, ContentQueueItem[]>();

  for (const item of queue) {
    const date = item.scheduledFor ?? item.createdAt;
    const key = date.toISOString().slice(0, 10);
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, items]) => ({
      dateKey,
      label: new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      items,
    }));
}
