"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createTemplateStockAction,
  fillCoverageGapsAction,
  generateAiStockSkinsAction,
  seedCategoryVariantsAction,
  setShopCategoryStatusAction,
  setTemplateStockStatusAction,
  upsertShopCategoryAction,
} from "@/app/actions";

export type CoverageRow = {
  id: string;
  label: string;
  parentId: string | null;
  parentLabel: string | null;
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
  storefrontBaseUrl,
}: {
  coverage: CoverageRow[];
  stock: StockRow[];
  liveTemplateIds: string[];
  bundleCounts: Record<string, number>;
  priorityVerticals?: PriorityVertical[];
  /** Public storefront origin for ops Preview links, e.g. https://commerce.guma.one */
  storefrontBaseUrl: string;
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

  function run(
    label: string,
    fn: () => Promise<{
      ok: boolean;
      error?: string;
      count?: number;
      variantsCreated?: number;
      categoriesTouched?: number;
      model?: string;
      fallback?: boolean;
    }>,
    options?: { goToStock?: boolean }
  ) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setMessage(result.error ?? "Action failed.");
        return;
      }
      if (typeof result.variantsCreated === "number") {
        setMessage(
          result.variantsCreated === 0
            ? "No new drafts needed — drafts or published stock already cover the min. Open Stock to publish any drafts."
            : `Filled gaps: ${result.variantsCreated} draft skin(s) across ${result.categoriesTouched ?? 0} categories. Coverage stays low until you Publish them in Stock.`
        );
        if (result.variantsCreated > 0 || options?.goToStock) setTab("stock");
      } else if (typeof result.count === "number") {
        if (result.count === 0) {
          setMessage(
            `${label}: nothing new created (drafts may already exist). Open Stock → Publish to raise Coverage.`
          );
        } else if (result.model) {
          setMessage(
            `${label}: created ${result.count} AI draft skin(s) via ${result.model}${
              result.fallback ? " (deterministic fallback — set GEMINI_API_KEY for live AI)" : ""
            }. Preview → Publish in Stock.`
          );
        } else {
          setMessage(
            `${label}: created ${result.count} draft skin(s). They do not raise Coverage until you Publish them in Stock.`
          );
        }
        if (options?.goToStock !== false && (result.count > 0 || label.toLowerCase().includes("seed") || label.toLowerCase().includes("ai"))) {
          setTab("stock");
        }
      } else {
        setMessage(`${label}: done.`);
      }
    });
  }

  function seedGap(row: CoverageRow): number {
    // Don't re-seed when drafts already fill the min (Coverage still waits on publish).
    const pipeline = row.bundleCount + row.stockPublished + row.stockDraft;
    return Math.max(0, row.minVariants - pipeline);
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
                    {v.categoryId && (() => {
                      const row = coverage.find((c) => c.id === v.categoryId);
                      const need = row ? seedGap(row) : v.gapToMin;
                      if (need <= 0 && row && row.stockDraft > 0) {
                        return (
                          <button
                            type="button"
                            onClick={() => setTab("stock")}
                            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white"
                          >
                            Publish drafts in Stock
                          </button>
                        );
                      }
                      if (need <= 0) return null;
                      return (
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              run(
                                `Seed ${v.category}`,
                                () =>
                                  seedCategoryVariantsAction(v.categoryId!, {
                                    count: need,
                                    publish: false,
                                    source: "ops_manual",
                                  }),
                                { goToStock: true }
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                          >
                            Seed {need} draft{need === 1 ? "" : "s"}
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              run(
                                `AI skins ${v.category}`,
                                () =>
                                  generateAiStockSkinsAction(v.categoryId!, {
                                    count: Math.max(3, need),
                                  }),
                                { goToStock: true }
                              )
                            }
                            className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-900 disabled:opacity-50"
                          >
                            Generate with AI
                          </button>
                        </div>
                      );
                    })()}
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
                      {seedGap(row) > 0 ? (
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              run(
                                `Seed ${row.label}`,
                                () =>
                                  seedCategoryVariantsAction(row.id, {
                                    count: seedGap(row),
                                    publish: false,
                                  }),
                                { goToStock: true }
                              )
                            }
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Seed {seedGap(row)}
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              run(
                                `AI skins ${row.label}`,
                                () =>
                                  generateAiStockSkinsAction(row.id, {
                                    count: Math.max(3, seedGap(row)),
                                  }),
                                { goToStock: true }
                              )
                            }
                            className="rounded-md border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-900 disabled:opacity-50"
                          >
                            AI
                          </button>
                        </div>
                      ) : row.gapToMin > 0 && row.stockDraft > 0 ? (
                        <button
                          type="button"
                          onClick={() => setTab("stock")}
                          className="text-xs font-semibold text-amber-700 underline"
                        >
                          Publish {row.stockDraft} draft{row.stockDraft === 1 ? "" : "s"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Seed / AI create <strong className="font-medium text-foreground">draft</strong> skins in
            Stock. Coverage only rises after you{" "}
            <strong className="font-medium text-foreground">Publish</strong> them (sellers then see
            them in Launch). AI uses Gemini Flash when <code>GEMINI_API_KEY</code> is set; otherwise
            deterministic fallback skins.
          </p>
        </div>
      )}

      {tab === "categories" && (
        <CategoriesTab
          coverage={coverage}
          pending={pending}
          run={run}
          seedGap={seedGap}
          onOpenStock={() => setTab("stock")}
        />
      )}

      {tab === "stock" && (
        <StockTab
          coverage={coverage}
          stock={stock}
          liveTemplateIds={liveTemplateIds}
          storefrontBaseUrl={storefrontBaseUrl}
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
  seedGap,
  onOpenStock,
}: {
  coverage: CoverageRow[];
  pending: boolean;
  run: (
    label: string,
    fn: () => Promise<{
      ok: boolean;
      error?: string;
      count?: number;
      model?: string;
      fallback?: boolean;
    }>,
    options?: { goToStock?: boolean }
  ) => void;
  seedGap: (row: CoverageRow) => number;
  onOpenStock: () => void;
}) {
  const [label, setLabel] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [minVariants, setMinVariants] = useState(3);
  const [targetVariants, setTargetVariants] = useState(5);
  const [editingId, setEditingId] = useState<string | null>(null);

  const topLevel = useMemo(
    () => coverage.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
    [coverage]
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string, CoverageRow[]>();
    for (const row of coverage) {
      if (!row.parentId) continue;
      const list = map.get(row.parentId) ?? [];
      list.push(row);
      map.set(row.parentId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
    }
    return map;
  }, [coverage]);

  const orderedRows = useMemo(() => {
    const rows: CoverageRow[] = [];
    for (const parent of topLevel) {
      rows.push(parent);
      for (const child of childrenByParent.get(parent.id) ?? []) rows.push(child);
    }
    // Orphans (parent missing / disabled elsewhere)
    for (const row of coverage) {
      if (row.parentId && !topLevel.some((p) => p.id === row.parentId) && !rows.includes(row)) {
        rows.push(row);
      }
    }
    return rows;
  }, [coverage, topLevel, childrenByParent]);

  const editing = editingId ? coverage.find((c) => c.id === editingId) : null;

  function startEdit(row: CoverageRow) {
    setEditingId(row.id);
    setLabel(row.label);
    setParentId(row.parentId ?? "");
    setMinVariants(row.minVariants);
    setTargetVariants(row.targetVariants);
  }

  function resetForm() {
    setEditingId(null);
    setLabel("");
    setParentId("");
    setMinVariants(3);
    setTargetVariants(5);
  }

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault();
          const payload = {
            id: editingId ?? undefined,
            label,
            parentId: parentId || null,
            minVariants,
            targetVariants,
            status: "enabled" as const,
          };
          run(editingId ? "Update category" : parentId ? "Add subcategory" : "Add category", () =>
            upsertShopCategoryAction(payload)
          );
          resetForm();
        }}
      >
        <label className="sm:col-span-2 text-sm lg:col-span-2">
          <span className="font-medium">
            {editingId ? "Edit category" : parentId ? "New subcategory" : "New category / vertical"}
          </span>
          <input
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={parentId ? "e.g. Streetwear" : "e.g. Vape & Specialty Retail"}
            required
          />
        </label>
        <label className="text-sm lg:col-span-2">
          <span className="font-medium">Parent (optional → subcategory)</span>
          <select
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">None — top-level vertical</option>
            {topLevel
              .filter((c) => c.id !== editingId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
          </select>
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
              {editingId ? "Save" : "Add"}
            </button>
          </div>
        </label>
        {editing && (
          <div className="sm:col-span-2 lg:col-span-6">
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium text-muted-foreground underline"
            >
              Cancel edit ({editing.label})
            </button>
          </div>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Label</th>
              <th className="px-3 py-2 font-medium">Level</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Goals</th>
              <th className="px-3 py-2 font-medium">Coverage</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderedRows.map((row) => {
              const needSeed = seedGap(row);
              return (
              <tr key={row.id} className="border-b border-border/60">
                <td className="px-3 py-2.5">
                  <p className={`font-medium ${row.parentId ? "pl-4 text-foreground" : "text-foreground"}`}>
                    {row.parentId ? `↳ ${row.label}` : row.label}
                  </p>
                  {row.parentLabel && (
                    <p className="pl-4 text-[11px] text-muted-foreground">under {row.parentLabel}</p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {row.parentId ? "Sub" : "Vertical"}
                </td>
                <td className="px-3 py-2.5 capitalize">{row.status}</td>
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                  {row.minVariants}–{row.targetVariants}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  <span className={row.total === 0 ? "font-semibold text-amber-700" : ""}>
                    {row.total}
                  </span>
                  {row.stockDraft > 0 && (
                    <span className="ml-1 text-[11px] text-muted-foreground">
                      (+{row.stockDraft} draft)
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {needSeed > 0 && (
                      <>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(
                              `Seed ${row.label}`,
                              () =>
                                seedCategoryVariantsAction(row.id, {
                                  count: needSeed,
                                  publish: false,
                                }),
                              { goToStock: true }
                            )
                          }
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Seed {needSeed}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(
                              `AI skins ${row.label}`,
                              () =>
                                generateAiStockSkinsAction(row.id, {
                                  count: Math.max(3, needSeed),
                                }),
                              { goToStock: true }
                            )
                          }
                          className="rounded-md border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-900 disabled:opacity-50"
                        >
                          AI
                        </button>
                      </>
                    )}
                    {needSeed === 0 && row.gapToMin > 0 && row.stockDraft > 0 && (
                      <button
                        type="button"
                        onClick={onOpenStock}
                        className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        Publish drafts
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startEdit(row)}
                      className="text-xs font-medium text-sky-700 underline disabled:opacity-50"
                    >
                      Edit
                    </button>
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
                      className="text-xs font-medium text-muted-foreground underline disabled:opacity-50"
                    >
                      {row.status === "enabled" ? "Disable" : "Enable"}
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Rows at 0 show <strong className="font-medium text-foreground">Seed</strong> (deterministic)
        or <strong className="font-medium text-foreground">AI</strong> (cheap model skins). Both create
        drafts — Publish in Stock so Coverage and Launch update. Categories can nest under a parent
        (one level).
      </p>
    </div>
  );
}

function StockTab({
  coverage,
  stock,
  liveTemplateIds,
  storefrontBaseUrl,
  pending,
  run,
}: {
  coverage: CoverageRow[];
  stock: StockRow[];
  liveTemplateIds: string[];
  storefrontBaseUrl: string;
  pending: boolean;
  run: (
    label: string,
    fn: () => Promise<{
      ok: boolean;
      error?: string;
      count?: number;
      model?: string;
      fallback?: boolean;
    }>,
    options?: { goToStock?: boolean }
  ) => void;
}) {
  const [label, setLabel] = useState("");
  const [categoryLabel, setCategoryLabel] = useState(coverage[0]?.label ?? "");
  const [liveTemplateId, setLiveTemplateId] = useState(
    coverage[0]?.liveTemplateId ?? liveTemplateIds[0] ?? "clean-guma"
  );
  const [publish, setPublish] = useState(false);

  const previewBase = storefrontBaseUrl.replace(/\/$/, "");
  function previewHref(stockKey: string) {
    return `${previewBase}/preview/stock/${encodeURIComponent(stockKey)}`;
  }

  const draftCount = stock.filter((s) => s.status === "draft" || s.status === "approved").length;
  const sortedStock = useMemo(() => {
    const rank = (s: StockRow) =>
      s.status === "draft" || s.status === "approved" ? 0 : s.status === "published" ? 1 : 2;
    return [...stock].sort((a, b) => rank(a) - rank(b) || a.categoryLabel.localeCompare(b.categoryLabel));
  }, [stock]);

  return (
    <div className="space-y-4">
      {draftCount > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {draftCount} draft skin{draftCount === 1 ? "" : "s"} waiting — click{" "}
          <strong className="font-semibold">Publish</strong> on each row (or Publish immediately when
          adding). Coverage and Launch update only after publish.
        </p>
      )}
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
        <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
            Publish immediately to Launch
          </label>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || !categoryLabel}
              onClick={() => {
                const row = coverage.find((c) => c.label === categoryLabel);
                if (!row) return;
                run(
                  `AI skins ${row.label}`,
                  () => generateAiStockSkinsAction(row.id, { count: 3 }),
                  { goToStock: true }
                );
              }}
              className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900 disabled:opacity-50"
            >
              Generate 3 with AI
            </button>
            <button
              type="submit"
              disabled={pending || !label.trim()}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Add skin
            </button>
          </div>
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
            {sortedStock.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No ops stock yet. Use Categories/Coverage → Seed, or add a skin above.
                </td>
              </tr>
            ) : (
              sortedStock.map((row) => (
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
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {row.status !== "archived" && (
                        <a
                          href={previewHref(row.stockKey)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-50"
                        >
                          Preview
                        </a>
                      )}
                      {row.status !== "published" && row.status !== "archived" && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run("Publish", () =>
                              setTemplateStockStatusAction(row.id, "published", row.label)
                            )
                          }
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Use <strong className="font-medium text-foreground">Preview</strong> to open the live
        storefront look before Publish. Published skins join Launch for that category. Each keeps a
        unique <code className="text-[11px]">storeLook</code> so shops don&apos;t clone.
      </p>
    </div>
  );
}
