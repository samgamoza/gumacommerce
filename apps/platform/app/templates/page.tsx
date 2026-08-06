import {
  countPublishedStockByCategory,
  ensureShopCategoriesSeeded,
  listRecentTemplateIntelligenceEvents,
  listShopBusinessCategories,
  listTemplateStock,
} from "@guma-commerce/db";
import {
  BUNDLE_2023_LICENSE,
  BUNDLE_2023_STATS,
  DEDICATED_PORT_PRIORITY,
  SHOP_BUSINESS_CATEGORIES,
  SHOP_TEMPLATES,
  countBundleSellerReadyByCategory,
  defaultLiveTemplateForCategory,
  listCatalogByCategory,
} from "@guma-commerce/storefront-themes";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { Panel, SectionHeader, StatCard } from "@/components/ui";
import {
  TemplateIntelligencePanel,
  type CoverageRow,
  type PriorityVertical,
} from "@/components/template-intelligence-panel";

export const dynamic = "force-dynamic";

export default async function TemplatesCatalogPage() {
  const session = await requireSuperAdmin();
  await ensureShopCategoriesSeeded(SHOP_BUSINESS_CATEGORIES);

  const categories = await listShopBusinessCategories();
  const stock = await listTemplateStock();
  const publishedStock = await countPublishedStockByCategory();
  const bundleCountsMap = countBundleSellerReadyByCategory();
  const bundleCounts = Object.fromEntries(bundleCountsMap.entries());
  const events = await listRecentTemplateIntelligenceEvents(12);
  const byCategory = listCatalogByCategory();

  const draftByCategory = new Map<string, number>();
  for (const row of stock) {
    if (row.status === "draft" || row.status === "approved") {
      draftByCategory.set(row.categoryLabel, (draftByCategory.get(row.categoryLabel) ?? 0) + 1);
    }
  }

  const coverage: CoverageRow[] = categories.map((cat) => {
    const bundleCount = bundleCountsMap.get(cat.label) ?? 0;
    const stockPublished = publishedStock.get(cat.label) ?? 0;
    const stockDraft = draftByCategory.get(cat.label) ?? 0;
    const total = bundleCount + stockPublished;
    return {
      id: cat.id,
      label: cat.label,
      status: cat.status,
      minVariants: cat.minVariants,
      targetVariants: cat.targetVariants,
      sortOrder: cat.sortOrder,
      notes: cat.notes,
      bundleCount,
      stockPublished,
      stockDraft,
      total,
      gapToMin: Math.max(0, cat.minVariants - total),
      gapToTarget: Math.max(0, cat.targetVariants - total),
      liveTemplateId: defaultLiveTemplateForCategory(cat.label),
    };
  });

  const enabledGaps = coverage.filter((c) => c.status === "enabled" && c.gapToMin > 0).length;
  const opsPublished = stock.filter((s) => s.status === "published").length;

  const priorityVerticals: PriorityVertical[] = DEDICATED_PORT_PRIORITY.map((p) => {
    const row = coverage.find((c) => c.label === p.category);
    return {
      category: p.category,
      reason: p.reason,
      interimTemplate: p.interimTemplate,
      suggestedPorts: p.suggestedPorts,
      categoryId: row?.id,
      stockPublished: row?.stockPublished ?? 0,
      gapToMin: row?.gapToMin ?? p.suggestedPorts.length,
    };
  });

  return (
    <PlatformShell
      title="Template Intelligence"
      subtitle="Curate Facebook-scale verticals once — every future seller inherits the fix"
      user={{ displayName: session.displayName, email: session.email }}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Onboarding categories" value={categories.length} />
        <StatCard
          label="Priority verticals"
          value={priorityVerticals.length}
          tone="amber"
          sub="Need dedicated ports / deeper stock"
        />
        <StatCard
          label="Below min (3+)"
          value={enabledGaps}
          tone={enabledGaps > 0 ? "amber" : "emerald"}
          sub="Enabled categories needing stock"
        />
        <StatCard label="Ops published stock" value={opsPublished} tone="sky" />
      </div>

      <Panel className="mb-6">
        <SectionHeader title="How this compounds" />
        <p className="text-sm text-muted-foreground">
          Address a vertical gap once in Priority verticals (seed stock, later AI-curate or port a
          dedicated skin). Sellers get honest commerce chrome today (inquiry vs cart by category) while
          the library deepens. Free Bundle stays the seed ({BUNDLE_2023_STATS.total} skins).{" "}
          {BUNDLE_2023_LICENSE}
        </p>
      </Panel>

      <Panel className="mb-6">
        <TemplateIntelligencePanel
          coverage={coverage}
          priorityVerticals={priorityVerticals}
          stock={stock.map((s) => ({
            id: s.id,
            stockKey: s.stockKey,
            label: s.label,
            categoryLabel: s.categoryLabel,
            liveTemplateId: s.liveTemplateId,
            status: s.status,
            source: s.source,
            notes: s.notes,
          }))}
          liveTemplateIds={SHOP_TEMPLATES.map((t) => t.id)}
          bundleCounts={bundleCounts}
        />
      </Panel>

      {events.length > 0 && (
        <Panel className="mb-6">
          <SectionHeader title="Recent intelligence events" />
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
                <span className="font-medium text-foreground">{e.eventType}</span>
                {e.categoryLabel && (
                  <span className="text-muted-foreground">{e.categoryLabel}</span>
                )}
                {e.stockKey && (
                  <span className="font-mono text-xs text-emerald-700">{e.stockKey}</span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="space-y-6">
        <SectionHeader title="Free Bundle reference (read-only)" />
        {byCategory.map((group) => (
          <Panel key={group.category}>
            <SectionHeader
              title={group.category}
              action={
                <span className="text-xs text-muted-foreground">
                  {group.entries.length} skins · ops total{" "}
                  {(bundleCountsMap.get(group.category) ?? 0) +
                    (publishedStock.get(group.category) ?? 0)}
                </span>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Label</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.map((entry) => (
                    <tr key={entry.proposedId} className="border-b border-border/60 align-top">
                      <td className="py-2.5 pr-3 text-muted-foreground">{entry.num}</td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-foreground">{entry.label}</p>
                        <p className="text-xs text-muted-foreground">{entry.proposedId}</p>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] capitalize">
                          {entry.status.replace(/-/g, " ")}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{entry.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ))}
      </div>
    </PlatformShell>
  );
}
