"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import type { StorefrontStoreSettings } from "@/lib/storefront-settings";

export function ManualPaymentPanel({
  tenantSlug,
  orderNumber,
  paymentMethod,
  totalLabel,
  instructions,
  shopAssistant,
  shopName,
  alreadyPaid,
}: {
  tenantSlug: string;
  orderNumber: string;
  paymentMethod: string;
  totalLabel: string;
  instructions: {
    accountName: string | null;
    accountNumber: string | null;
    bankName: string | null;
    note: string;
  };
  shopAssistant: StorefrontStoreSettings["shopAssistant"];
  shopName: string;
  alreadyPaid: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  if (alreadyPaid) return null;
  if (paymentMethod === "cod") return null;

  async function uploadScreenshot(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("tenantSlug", tenantSlug);
      formData.set("orderNumber", orderNumber);
      formData.set("file", file);
      const res = await fetch("/api/orders/payment-proof", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.ok || typeof data.url !== "string") {
        setError(data.error ?? "Could not upload screenshot.");
        return;
      }
      setProofUrl(data.url);
      setProofName(file.name);
    } catch {
      setError("Network error while uploading.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submitReference() {
    if (reference.trim().length < 4 && !proofUrl) {
      setError("Enter a reference number and/or upload a payment screenshot.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/orders/payment-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          orderNumber,
          reference: reference.trim() || `screenshot-${Date.now()}`,
          proofUrl: proofUrl ?? "",
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not save payment proof.");
        setStatus("error");
        return;
      }
      setStatus("ok");
      setChatOpen(true);
    } catch {
      setError("Network error.");
      setStatus("error");
    }
  }

  const methodLabel =
    paymentMethod === "paymaya" ? "Maya" : paymentMethod === "bank" ? "Bank" : "GCash";

  return (
    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div>
        <p className="text-sm font-semibold">Pay via {methodLabel} (direct transfer)</p>
        <p className="mt-1 text-sm">
          Send exactly <strong>{totalLabel}</strong> and include{" "}
          <strong>{orderNumber}</strong> in the transfer notes.
        </p>
      </div>
      <dl className="space-y-1 text-sm">
        {instructions.bankName ? (
          <div>
            <dt className="inline text-amber-800/80">Bank: </dt>
            <dd className="inline font-medium">{instructions.bankName}</dd>
          </div>
        ) : null}
        {instructions.accountName ? (
          <div>
            <dt className="inline text-amber-800/80">Account name: </dt>
            <dd className="inline font-medium">{instructions.accountName}</dd>
          </div>
        ) : null}
        {instructions.accountNumber ? (
          <div>
            <dt className="inline text-amber-800/80">Number: </dt>
            <dd className="inline font-medium">{instructions.accountNumber}</dd>
          </div>
        ) : (
          <p className="text-sm text-amber-900/80">
            The shop has not published a receiving number yet — message them in chat for
            payment details.
          </p>
        )}
      </dl>
      <p className="text-xs text-amber-900/80">{instructions.note}</p>

      <div className="space-y-2 rounded-xl border border-amber-200/80 bg-white/70 p-3">
        <p className="text-sm font-medium">Payment screenshot</p>
        <p className="text-xs text-amber-900/70">
          Upload your {methodLabel} receipt so the seller can confirm faster (JPG/PNG, max 5 MB).
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadScreenshot(file);
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium disabled:opacity-50"
          >
            {uploading ? "Uploading…" : proofUrl ? "Replace screenshot" : "Upload screenshot"}
          </button>
          {proofName ? (
            <span className="truncate text-xs text-neutral-600">{proofName}</span>
          ) : null}
        </div>
        {proofUrl ? (
          <div className="relative mt-2 h-40 w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
            <Image
              src={proofUrl}
              alt="Payment screenshot preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={`${methodLabel} reference no. (optional if screenshot uploaded)`}
          className="h-10 flex-1 rounded-lg border border-amber-200 bg-white px-3 text-sm"
        />
        <button
          type="button"
          onClick={() => void submitReference()}
          disabled={status === "saving" || uploading}
          className="h-10 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "I paid — submit proof"}
        </button>
      </div>
      {status === "ok" ? (
        <p className="text-sm text-emerald-800">
          Proof saved. Message the seller in chat if you need faster confirmation.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 underline underline-offset-2"
      >
        Message seller about this payment
      </button>

      {chatOpen ? (
        <ShopAssistant
          tenantSlug={tenantSlug}
          shopName={shopName}
          assistant={shopAssistant}
          orderNumber={orderNumber}
          defaultOpen
          initialMode="seller"
          hideLauncher
          onClose={() => setChatOpen(false)}
        />
      ) : null}
    </div>
  );
}
