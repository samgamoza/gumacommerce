import Link from "next/link";
import { Flag, ShieldCheck } from "lucide-react";
import { getModerationCounts, listModerationQueue } from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { FilterBar } from "@/components/filter-bar";
import { ModerationActions } from "@/components/moderation-actions";
import { EmptyState, Panel, StatCard, StatusPill } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

interface PageProps {
  searchParams: Promise<{ status?: string; flagged?: string; search?: string }>;
}

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  facebook: "👍",
  whatsapp: "💬",
};

export default async function ModerationPage({ searchParams }: PageProps) {
  const session = await requireSuperAdmin();
  const filters = await searchParams;
  const [counts, items] = await Promise.all([
    getModerationCounts(),
    listModerationQueue({
      status: filters.status,
      flaggedOnly: filters.flagged === "1",
      search: filters.search,
    }),
  ]);

  return (
    <PlatformShell
      title="Content moderation"
      subtitle="AI-generated posts across all shops"
      user={{ displayName: session.displayName, email: session.email }}
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total content" value={counts.total} tone="violet" />
        <StatCard label="Awaiting review" value={counts.pending} tone="amber" />
        <StatCard
          label="Flagged"
          value={counts.flagged}
          icon={<Flag className="h-5 w-5" />}
          tone="rose"
        />
      </div>

      <FilterBar
        basePath="/moderation"
        searchPlaceholder="Search post text…"
        selects={[
          {
            name: "status",
            label: "All statuses",
            options: [
              { value: "draft", label: "Draft" },
              { value: "approved", label: "Approved" },
              { value: "scheduled", label: "Scheduled" },
              { value: "posted", label: "Posted" },
              { value: "skipped", label: "Skipped" },
            ],
          },
          {
            name: "flagged",
            label: "All items",
            options: [{ value: "1", label: "Flagged only" }],
          },
        ]}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Nothing to moderate"
          hint="No content matches your filters."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Panel
              key={item.id}
              className={item.flagged ? "border-rose-200 bg-rose-50/40" : ""}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{PLATFORM_EMOJI[item.platform] ?? "📄"}</span>
                  <div>
                    <Link
                      href={item.tenantSlug ? `/tenants/${item.tenantId}` : "#"}
                      className="font-semibold hover:text-primary hover:underline"
                    >
                      {item.tenantName ?? "Unknown shop"}
                    </Link>
                    <p className="text-xs capitalize text-muted-foreground">
                      {item.platform} · {item.agentKey} · {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.flagged && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                      <Flag className="h-3 w-3" />
                      Flagged
                    </span>
                  )}
                  <StatusPill status={item.status} />
                </div>
              </div>

              {item.title && <p className="mt-3 font-semibold">{item.title}</p>}
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{item.body}</p>
              {item.mediaBrief && (
                <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  🎨 {item.mediaBrief}
                </p>
              )}
              {item.moderationNote && (
                <p className="mt-2 text-xs text-rose-600">Note: {item.moderationNote}</p>
              )}

              <div className="mt-4 border-t border-border pt-3">
                <ModerationActions
                  itemId={item.id}
                  label={`${item.tenantName ?? "post"} — ${item.platform}`}
                  status={item.status}
                  flagged={item.flagged}
                />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
