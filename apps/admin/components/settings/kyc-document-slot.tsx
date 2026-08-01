"use client";

import { useRef, useState } from "react";
import type { KycDocType, KycSessionRecord } from "@guma-commerce/db";
import { Camera, CheckCircle2, ImagePlus, Loader2 } from "lucide-react";

interface KycDocumentSlotProps {
  label: string;
  hint: string;
  docType: KycDocType;
  idCategory?: string;
  sessionId: string;
  kycToken?: string;
  uploaded?: boolean;
  documentId?: string;
  capture?: "user" | "environment";
  onUploaded: () => void;
}

export function KycDocumentSlot({
  label,
  hint,
  docType,
  idCategory,
  sessionId,
  kycToken,
  uploaded,
  documentId,
  capture = "environment",
  onUploaded,
}: KycDocumentSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("docType", docType);
    if (idCategory) formData.set("idCategory", idCategory);
    if (kycToken) {
      formData.set("token", kycToken);
    } else {
      formData.set("sessionId", sessionId);
    }

    const res = await fetch("/api/kyc/upload", {
      method: "POST",
      headers: kycToken ? { "x-kyc-token": kycToken } : undefined,
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    if (!data.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    onUploaded();
  }

  const previewUrl =
    uploaded && documentId
      ? `/api/kyc/document/${documentId}${kycToken ? `?token=${encodeURIComponent(kycToken)}` : ""}`
      : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
        {uploaded ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        ) : null}
      </div>

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={label}
          className="mt-3 h-36 w-full rounded-lg border border-border object-cover"
        />
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {uploaded ? "Replace photo" : "Upload photo"}
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.setAttribute("capture", capture);
              inputRef.current.click();
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          <Camera className="h-4 w-4" />
          Take photo
        </button>
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
