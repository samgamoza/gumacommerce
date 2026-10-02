"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { reviewKycAction } from "@/app/actions";

export interface KycReviewSummary {
  sessionId: string;
  status: string;
  idPath: string | null;
  idTypes: string[];
  documentTypes: string[];
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Started, not submitted",
  in_progress: "Uploading documents",
  submitted: "Waiting for review",
  approved: "Approved",
  rejected: "Rejected",
};

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export function KycReviewPanel({
  tenantId,
  name,
  kyc,
}: {
  tenantId: string;
  name: string;
  kyc: KycReviewSummary | null;
}) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  if (!kyc) {
    return <p className="text-sm text-muted-foreground">This shop hasn&apos;t started KYC.</p>;
  }

  function review(decision: "approve" | "reject") {
    setMessage(null);
    startTransition(async () => {
      const res = await reviewKycAction({
        tenantId,
        sessionId: kyc!.sessionId,
        decision,
        reason: decision === "reject" ? reason : undefined,
        label: name,
      });
      if (res.ok) {
        setMessage({ tone: "ok", text: decision === "approve" ? "KYC approved." : "KYC rejected." });
        setReason("");
      } else {
        setMessage({ tone: "err", text: res.error });
      }
    });
  }

  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5">
        <dt className="text-muted-foreground">Status</dt>
        <dd className="font-semibold">{STATUS_LABEL[kyc.status] ?? kyc.status}</dd>
        <dt className="text-muted-foreground">ID option</dt>
        <dd className="capitalize">{kyc.idPath ?? "—"}</dd>
        <dt className="text-muted-foreground">ID types</dt>
        <dd>{kyc.idTypes.length ? kyc.idTypes.join(", ") : "—"}</dd>
        <dt className="text-muted-foreground">Documents</dt>
        <dd>
          {kyc.documentTypes.length
            ? `${kyc.documentTypes.length} (${kyc.documentTypes.join(", ").replace(/_/g, " ")})`
            : "None"}
        </dd>
        <dt className="text-muted-foreground">Submitted</dt>
        <dd>{formatWhen(kyc.submittedAt)}</dd>
        <dt className="text-muted-foreground">Reviewed</dt>
        <dd>{formatWhen(kyc.reviewedAt)}</dd>
        {kyc.rejectionReason ? (
          <>
            <dt className="text-muted-foreground">Reason</dt>
            <dd>{kyc.rejectionReason}</dd>
          </>
        ) : null}
      </dl>

      {kyc.status === "submitted" ? (
        <>
          <p className="text-xs text-muted-foreground">
            Check the ID photos and selfie with <strong>Support access</strong> → Settings → KYC
            before approving. Approval lets this shop receive payouts.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Reason (required to reject) — e.g. selfie is blurry, ID expired"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => review("approve")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve
            </button>
            <button
              type="button"
              disabled={pending || !reason.trim()}
              onClick={() => review("reject")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
          </div>
        </>
      ) : null}

      {message ? (
        <p className={message.tone === "ok" ? "text-emerald-700" : "text-red-700"}>{message.text}</p>
      ) : null}
    </div>
  );
}
