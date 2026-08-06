"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createTemplateStockAction,
  fillCoverageGapsAction,
  seedCategoryVariantsAction,
  setShopCategoryStatusAction,
  setTemplateStockStatusAction,
  upsertShopCategoryAction,
} from "@/app/actions";

export type CoverageRow = {
  id: string;
  label: string;
  status: "enabled" | "disabled";
  minVariants: number;
  targetVariants: number;
  sortOrder: number;
  notes: string | null;
  bundleCount: number;
  stockPublished: number;
  stockDraft: number;
  total: number;
  gapToMin: number;
  gapToTarget: number;
  liveTemplateId: string;
};

export type StockRow = {
  id: string;
  stockKey: string;
  label: string;
  categoryLabel: string;
  liveTemplateId: string;
  status: "draft" | "approved" | "published" | "archived";
  source: string;
  notes: string | null;
};

export type PriorityVertical = {
  category: string;
  reason: string;
  interimTemplate: string;
  suggestedPorts: string[];
  categoryId?: string;
  stockPublished: number;
  gapToMin: number;
};

export function TemplateIntelligencePanel({
  coverage,
  stock,
  liveTemplateIds,
  bundleCounts,
  priorityVerticals = [],
}: {
  coverage: CoverageRow[];
  stock: StockRow[];
  liveTemplateIds: string[];
  bundleCounts: Record<string, number>;
  priorityVerticals?: PriorityVertical[];
}) {
  const [tab, setTab] = useState<"verticals" | "coverage" | "categories" | "stock">(
    priorityVerticals.length > 0 ? "verticals" : "coverage"
  );
  const [filter, setFilter] = useState<"all" | "gaps" | "healthy">("gaps");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "gaps") return coverage.filter((r) => r.gapToMin > 0);
    if (filter === "healthy") return coverage.filter((r) => r.gapToMin <= 0);
    return coverage;
  }, [coverage, filter]);

  const gaps = coverage.filter((r) => r.status === "enabled" && r.gapToMin > 0).length;
  const healthy = coverage.filter((r) => r.status === "enabled" && r.gapToMin <= 0).length;

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string; count?: number; variantsCreated?: number; categoriesTouched?: number }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setMessage(result.error ?? "Action failed.");
        return;
      }
      if (typeof result.variantsCreated === "number") {
        setMessage(
          `Filled gaps: ${result.variantsCreated} draft skins across ${result.categoriesTouched ?? 0} categories. Review & publish in Stock.`
        );
      } else if (typeof result.count === "number") {
        setMessage(`${label}: created ${result.count} draft skin(s).`);
      } else {
        setMessage(`${label}: done.`);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["verticals", "Priority verticals"],
            ["coverage", "Coverage"],
            ["categories", "Categories"],
            ["stock", "Stock"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === id
                ? "bg-emerald-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {id === "verticals" && priorityVerticals.length > 0
              ? ` (${priorityVerticals.length})`
              : ""}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {healthy} healthy · {gaps} below min
        </span>
      </div>

      {message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}

      {tab === "verticals" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Facebook-scale verticals that still share an interim renderer. Curate stock (or port a
            dedicated skin) once — every future seller in that category benefits. Product pages already
            switch to service language (inquiry vs cart) for these verticals.
          </p>
          {priorityVerticals.length === 0 ? (
            <p className="rounded-xl border border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No priority verticals flagged.
            </p>
          ) : (
            <div className="space-y-3">
              {priorityVerticals.map((v) => (
                <div
                  key={v.category}
                  className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{v.category}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{v.reason}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Interim renderer:{" "}
                        <span className="font-mono text-emerald-700">{v.interimTemplate}</span>
                        {" · "}
                        Suggested ports: {v.suggestedPorts.join(", ")}
                        {" · "}
                        Published stock: {v.stockPublished}
                        {v.gapToMin > 0 ? ` · needs ${v.gapToMin} more to min` : ""}
                      </p>
                    </div>
                    {v.categoryId && v.gapToMin > 0 && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(`Seed ${v.category}`, () =>
                            seedCategoryVariantsAction(v.categoryId!, {
                              count: v.gapToMin,
                              publish: false,
                              source: "ops_manual",
                            })
                          )
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                      >
                        Seed draft skins
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "coverage" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["gaps", "Needs stock"],
                ["healthy", "At goal"],
                ["all", "All"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  filter === id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              disabled={pending || gaps === 0}
              onClick={() =>
                run("Fill coverage gaps", () => fillCoverageGapsAction(bundleCounts))
              }
              className="ml-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? "Working…" : "Fill gaps to min (drafts)"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Bundle</th>
                  <th className="px-3 py-2 font-medium">Ops stock</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Goal</th>
                  <th className="px-3 py-2 font-medium">Live base</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-foreground">{row.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.status}
                        {row.gapToMin > 0 ? ` · needs ${row.gapToMin} more` : " · min met"}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{row.bundleCount}</td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {row.stockPublished}
                      {row.stockDraft > 0 ? (
                        <span className="text-muted-foreground"> +{row.stockDraft} draft</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-medium">{row.total}</td>
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                      {row.minVariants}–{row.targetVariants}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-emerald-700">
                      {row.liveTemplateId}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {row.gapToMin > 0 && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(`Seed ${row.label}`, () =>
                              seedCategoryVariantsAction(row.id, {
                                count: row.gapToMin,
                                publish: false,
                              })
                            )
                          }
                          className="text-xs font-medium text-emerald-700 underline disabled:opacity-50"
                        >
                          Seed drafts
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "categories" && (
        <CategoriesTab coverage={coverage} pending={pending} run={run} />
      )}

      {tab === "stock" && (
        <StockTab
          coverage={coverage}
          stock={stock}
          liveTemplateIds={liveTemplateIds}
          pending={pending}
          run={run}
        />
      )}
    </div>
  );
}

function CategoriesTab({
  coverage,
  pending,
  run,
}: {
  coverage: CoverageRow[];
  pending: boolean;
  run: (label: string, fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [label, setLabel] = useState("");
  const [minVariants, setMinVariants] = useState(3);
  const [targetVariants, setTargetVariants] = useState(5);

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          run("Add category", () =>
            upsertShopCategoryAction({
              label,
              minVariants,
              targetVariants,
              status: "enabled",
            })
          );
          setLabel("");
        }}
      >
        <label className="sm:col-span-2 text-sm">
          <span className="font-medium">New onboarding category</span>
          <input
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Vape & Specialty Retail"
            required
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Min variants</span>
          <input
            type="number"
            min={1}
            max={20}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={minVariants}
            onChange={(e) => setMinVariants(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Target</span>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              min={1}
              max={40}
              className="w-full rounded-lg border border-border px-3 py-2"
              value={targetVariants}
              onChange={(e) => setTargetVariants(Number(e.target.value))}
            />
            <button
              type="submit"
              disabled={pending || !label.trim()}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </label>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Label</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Goals</th>
              <th className="px-3 py-2 font-medium">Coverage</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {coverage.map((row) => (
              <tr key={row.id} className="border-b border-border/60">
                <td className="px-3 py-2.5 font-medium">{row.label}</td>
                <td className="px-3 py-2.5 capitalize">{row.status}</td>
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                  {row.minVariants}–{row.targetVariants}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{row.total}</td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        row.status === "enabled" ? "Disable" : "Enable",
                        () =>
                          setShopCategoryStatusAction(
                            row.id,
                            row.status === "enabled" ? "disabled" : "enabled",
                            row.label
                          )
                      )
                    }
                    className="text-xs font-medium text-emerald-700 underline disabled:opacity-50"
                  >
                    {row.status === "enabled" ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Enabled categories appear in seller signup and Launch DNA. Disabled ones stay in history but
        are hidden from new shops.
      </p>
    </div>
  );
}

function StockTab({
  coverage,
  stock,
  liveTemplateIds,
  pending,
  run,
}: {
  coverage: CoverageRow[];
  stock: StockRow[];
  liveTemplateIds: string[];
  pending: boolean;
  run: (label: string, fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [label, setLabel] = useState("");
  const [categoryLabel, setCategoryLabel] = useState(coverage[0]?.label ?? "");
  const [liveTemplateId, setLiveTemplateId] = useState(
    coverage[0]?.liveTemplateId ?? liveTemplateIds[0] ?? "clean-guma"
  );
  const [publish, setPublish] = useState(false);

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          run("Add stock", () =>
            createTemplateStockAction({
              label,
              categoryLabel,
              liveTemplateId,
              publish,
              source: "ops_manual",
            })
          );
          setLabel("");
        }}
      >
        <label className="text-sm">
          <span className="font-medium">Skin label</span>
          <input
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Fashion Soft Bloom"
            required
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Category</span>
          <select
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={categoryLabel}
            onChange={(e) => {
              setCategoryLabel(e.target.value);
              const row = coverage.find((c) => c.label === e.target.value);
              if (row) setLiveTemplateId(row.liveTemplateId);
            }}
          >
            {coverage.map((c) => (
              <option key={c.id} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium">Live renderer</span>
          <select
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={liveTemplateId}
            onChange={(e) => setLiveTemplateId(e.target.value)}
          >
            {liveTemplateIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
            Publish immediately to Launch
          </label>
          <button
            type="submit"
            disabled={pending || !label.trim()}
            className="ml-auto rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Add skin
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Skin</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Renderer</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {stock.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No ops stock yet. Use Coverage → Fill gaps, or add a skin above.
                </td>
              </tr>
            ) : (
              stock.map((row) => (
                <tr key={row.id} className="border-b border-border/60 align-top">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{row.label}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{row.stockKey}</p>
                  </td>
                  <td className="px-3 py-2.5">{row.categoryLabel}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-emerald-700">
                    {row.liveTemplateId}
                  </td>
                  <td className="px-3 py-2.5 capitalize text-muted-foreground">
                    {row.source.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2.5 capitalize">{row.status}</td>
                  <td className="px-3 py-2.5 text-right space-x-2">
                    {row.status !== "published" && row.status !== "archived" && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run("Publish", () =>
                            setTemplateStockStatusAction(row.id, "published", row.label)
                          )
                        }
                        className="text-xs font-medium text-emerald-700 underline disabled:opacity-50"
                      >
                        Publish
                      </button>
                    )}
                    {row.status === "published" && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run("Archive", () =>
                            setTemplateStockStatusAction(row.id, "archived", row.label)
                          )
                        }
                        className="text-xs font-medium text-muted-foreground underline disabled:opacity-50"
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Published skins join the Free Bundle gallery in Launch for that category. Each keeps a unique{" "}
        <code className="text-[11px]">storeLook</code> so shops don&apos;t clone. AI-curated source is
        ready when you wire paid models — seeding today is deterministic and free.
      </p>
    </div>
  );
}
