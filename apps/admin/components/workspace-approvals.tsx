"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@guma-commerce/ui";

interface ChangeRequest {
  id: string;
  domain: string;
  status: string;
  scope: string;
  approvalLevel: string;
  summary: string | null;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  reviewNote: string | null;
  createdAt: string;
  publishedAt: string | null;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityLabel: string | null;
  actorEmail: string | null;
  createdAt: string;
}

const CATALOG_DIFF_KEYS = [
  "title",
  "slug",
  "shortDescription",
  "basePrice",
  "compareAtPrice",
  "stockQty",
  "status",
  "tags",
  "productId",
] as const;

const PRICING_DIFF_KEYS = [
  "title",
  "basePrice",
  "compareAtPrice",
  "rationale",
  "productId",
] as const;

const SEO_DIFF_KEYS = [
  "siteTitle",
  "metaDescription",
  "keywords",
  "canonicalUrl",
  "robots",
  "openGraph",
  "twitter",
  "rationale",
] as const;

function formatDiffValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string") {
    const plain = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (plain.length > 160) return `${plain.slice(0, 160)}…`;
    return plain || value;
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string")) return value.join(", ");
    return JSON.stringify(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function DiffPanel({
  domain,
  before,
  after,
}: {
  domain: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const preferred =
    domain === "catalog"
      ? [
          ...CATALOG_DIFF_KEYS,
          ...Object.keys(after ?? {}),
          ...Object.keys(before ?? {}),
        ]
      : domain === "pricing"
        ? [
            ...PRICING_DIFF_KEYS,
            ...Object.keys(after ?? {}),
            ...Object.keys(before ?? {}),
          ]
        : domain === "seo"
          ? [
              ...SEO_DIFF_KEYS,
              ...Object.keys(after ?? {}),
              ...Object.keys(before ?? {}),
            ]
          : [...Object.keys(before ?? {}), ...Object.keys(after ?? {})];

  const keys = Array.from(new Set(preferred)).filter((key) => {
    if (domain === "catalog" && key === "descriptionHtml") return false;
    return before?.[key] !== undefined || after?.[key] !== undefined;
  });

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-xs">
      <div className="grid grid-cols-2 border-b border-gray-200 bg-white px-3 py-2 font-semibold text-gray-700">
        <span>Before</span>
        <span>After</span>
      </div>
      <div className="max-h-56 overflow-auto">
        {keys.length === 0 ? (
          <p className="p-3 text-gray-500">No snapshot fields</p>
        ) : (
          keys.map((key) => {
            const b = before?.[key];
            const a = after?.[key];
            const changed = JSON.stringify(b) !== JSON.stringify(a);
            return (
              <div
                key={key}
                className={`grid grid-cols-2 gap-2 border-b border-gray-100 px-3 py-2 ${
                  changed ? "bg-amber-50/80" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-gray-500">{key}</p>
                  <p className="break-all text-gray-800">{formatDiffValue(b)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">{key}</p>
                  <p className="break-all text-gray-800">{formatDiffValue(a)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      {domain === "catalog" && after?.descriptionHtml != null && (
        <div className="border-t border-gray-200 bg-white px-3 py-2 text-gray-600">
          <p className="font-medium text-gray-500">description (preview)</p>
          <p className="mt-1 line-clamp-4">{formatDiffValue(after.descriptionHtml)}</p>
        </div>
      )}
    </div>
  );
}

export function WorkspaceApprovals() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, auditRes] = await Promise.all([
        fetch("/api/change-requests"),
        fetch("/api/change-requests?view=audit"),
      ]);
      const reqData = await reqRes.json();
      const auditData = await auditRes.json();
      if (reqData.ok) setRequests(reqData.requests ?? []);
      if (auditData.ok) setAudit(auditData.audit ?? []);
      if (!reqData.ok) setError(reqData.error ?? "Could not load approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(action: "approve" | "reject" | "publish" | "rollback", id: string) {
    setActing(id + action);
    setError(null);
    try {
      const res = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Action failed");
        return;
      }
      await load();
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading approvals…</p>;
  }

  const pending = requests.filter((r) =>
    ["draft", "pending_review", "approved"].includes(r.status)
  );
  const history = requests.filter((r) =>
    ["published", "rejected", "rolled_back"].includes(r.status)
  );

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Approvals</h2>
        <p className="mt-1 text-sm text-gray-600">
          Crown jewel: theme, catalog, pricing, and SEO changes land as reviewable requests with
          before/after diff and audit.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Pending / actionable
        </h3>
        {pending.length === 0 ? (
          <Card className="border-dashed p-5 text-sm text-gray-500">
            No pending change requests. Publish from GUMA Launch or generate an AI product listing
            to create the next audited change.
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{r.summary ?? r.scope}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {r.domain} · {r.status} · {r.approvalLevel} ·{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    >
                      {expanded === r.id ? "Hide diff" : "View diff"}
                    </Button>
                    {r.status !== "approved" && (
                      <Button
                        size="sm"
                        disabled={!!acting}
                        onClick={() => void act("approve", r.id)}
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={!!acting}
                      onClick={() => void act("publish", r.id)}
                    >
                      {r.domain === "catalog"
                        ? "Publish product"
                        : r.domain === "pricing"
                          ? "Apply price"
                          : r.domain === "seo"
                            ? "Publish SEO"
                            : "Publish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!!acting}
                      onClick={() => void act("reject", r.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                {expanded === r.id && (
                  <DiffPanel domain={r.domain} before={r.beforeJson} after={r.afterJson} />
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Published history
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No published/rejected requests yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{r.summary ?? r.scope}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {r.domain} · {r.status} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {r.status === "published" &&
                    (r.domain === "theme" || r.domain === "seo") && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!!acting}
                      onClick={() => void act("rollback", r.id)}
                    >
                      Rollback
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Tenant audit trail
        </h3>
        {audit.length === 0 ? (
          <p className="text-sm text-gray-500">No tenant-scoped audit entries yet.</p>
        ) : (
          <Card className="divide-y divide-gray-100 p-0">
            {audit.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{row.action}</p>
                  <p className="text-xs text-gray-500">
                    {row.entityType}
                    {row.entityLabel ? ` · ${row.entityLabel}` : ""} · {row.actorEmail ?? "system"}
                  </p>
                </div>
                <p className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
