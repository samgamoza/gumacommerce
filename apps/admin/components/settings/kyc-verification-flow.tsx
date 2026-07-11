"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import type { KycIdPath, KycSessionRecord } from "@guma-commerce/db";
import { KycDocumentSlot } from "@/components/settings/kyc-document-slot";
import { PH_PRIMARY_IDS, PH_SECONDARY_IDS, getPhIdType } from "@/lib/kyc-id-types";
import { useHasCamera, useIsMobileViewport } from "@/lib/use-device-camera";

type Step = "path" | "ids" | "upload" | "review";

interface KycVerificationFlowProps {
  initialSession: KycSessionRecord | null;
  mobileUrl?: string;
  kycToken?: string;
  onVerified: () => void;
}

function docFor(session: KycSessionRecord, type: string) {
  return session.documents.find((d) => d.docType === type);
}

export function KycVerificationFlow({
  initialSession,
  mobileUrl,
  kycToken,
  onVerified,
}: KycVerificationFlowProps) {
  const hasCamera = useHasCamera();
  const isMobile = useIsMobileViewport();
  const [session, setSession] = useState<KycSessionRecord | null>(initialSession);
  const [step, setStep] = useState<Step>(() => {
    if (!initialSession?.idPath) return "path";
    if (
      initialSession.idPath === "primary"
        ? !initialSession.primaryIdType
        : !initialSession.secondaryIdType1 || !initialSession.secondaryIdType2
    ) {
      return "ids";
    }
    return "upload";
  });
  const [idPath, setIdPath] = useState<KycIdPath | null>(initialSession?.idPath ?? null);
  const [primaryIdType, setPrimaryIdType] = useState(initialSession?.primaryIdType ?? "");
  const [secondaryIdType1, setSecondaryIdType1] = useState(initialSession?.secondaryIdType1 ?? "");
  const [secondaryIdType2, setSecondaryIdType2] = useState(initialSession?.secondaryIdType2 ?? "");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileQr, setShowMobileQr] = useState(false);

  const refreshSession = useCallback(async () => {
    if (kycToken) {
      const res = await fetch("/api/kyc/session", {
        headers: { "x-kyc-token": kycToken },
      });
      const data = await res.json();
      if (data.ok) setSession(data.session);
      return;
    }
    const res = await fetch("/api/kyc");
    const data = await res.json();
    if (data.ok) setSession(data.session);
  }, [kycToken]);

  useEffect(() => {
    if (!showMobileQr || kycToken) return;
    const timer = window.setInterval(() => {
      void refreshSession();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [showMobileQr, kycToken, refreshSession]);

  useEffect(() => {
    if (!session) return;
    if (session.status === "approved") onVerified();
  }, [session, onVerified]);

  useEffect(() => {
    const shouldOfferQr =
      !kycToken && !isMobile && hasCamera === "no" && step === "upload" && Boolean(mobileUrl);
    setShowMobileQr(shouldOfferQr);
  }, [hasCamera, isMobile, kycToken, mobileUrl, step]);

  if (!session) {
    return <p className="text-sm text-gray-500">Starting verification…</p>;
  }

  async function savePath(path: KycIdPath) {
    setSaving(true);
    setError(null);
    setIdPath(path);
    const res = await fetch("/api/kyc/session", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(kycToken ? { "x-kyc-token": kycToken } : {}),
      },
      body: JSON.stringify({ sessionId: session!.id, idPath: path }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }
    setSession(data.session);
    setStep("ids");
  }

  async function saveIdTypes() {
    setSaving(true);
    setError(null);
    const payload =
      idPath === "primary"
        ? { sessionId: session!.id, primaryIdType, secondaryIdType1: null, secondaryIdType2: null }
        : {
            sessionId: session!.id,
            primaryIdType: null,
            secondaryIdType1,
            secondaryIdType2,
          };

    const res = await fetch("/api/kyc/session", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(kycToken ? { "x-kyc-token": kycToken } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) {
      setError(data.error ?? "Could not save ID types.");
      return;
    }
    setSession(data.session);
    setStep("upload");
  }

  async function submitVerification() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/kyc/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(kycToken ? { "x-kyc-token": kycToken } : {}),
      },
      body: JSON.stringify({ sessionId: session!.id }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) {
      setError(data.error ?? "Could not submit verification.");
      return;
    }
    setSession(data.session);
    onVerified();
  }

  const primaryDoc = docFor(session, "primary_id");
  const secondary1Doc = docFor(session, "secondary_id_1");
  const secondary2Doc = docFor(session, "secondary_id_2");
  const selfieDoc = docFor(session, "selfie");

  const uploadComplete =
    Boolean(selfieDoc) &&
    (idPath === "primary"
      ? Boolean(primaryDoc)
      : Boolean(secondary1Doc) && Boolean(secondary2Doc));

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {step === "path" ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Philippine regulations accept either <strong>one primary ID</strong> or{" "}
            <strong>two secondary IDs</strong>, plus a selfie holding your ID.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => savePath("primary")}
              className="rounded-xl border-2 border-gray-200 p-4 text-left hover:border-emerald-500 hover:bg-emerald-50/40 disabled:opacity-60"
            >
              <p className="font-semibold text-gray-900">1 Primary ID</p>
              <p className="mt-1 text-xs text-gray-500">
                Passport, Driver&apos;s License, UMID, National ID, PRC ID, or Postal ID
              </p>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => savePath("secondary")}
              className="rounded-xl border-2 border-gray-200 p-4 text-left hover:border-emerald-500 hover:bg-emerald-50/40 disabled:opacity-60"
            >
              <p className="font-semibold text-gray-900">2 Secondary IDs</p>
              <p className="mt-1 text-xs text-gray-500">
                SSS, PhilHealth, TIN, Barangay ID, company/school ID, clearances, etc.
              </p>
            </button>
          </div>
        </div>
      ) : null}

      {step === "ids" ? (
        <div className="space-y-4">
          {idPath === "primary" ? (
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Primary ID type</span>
              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                value={primaryIdType}
                onChange={(e) => setPrimaryIdType(e.target.value)}
              >
                <option value="">Select…</option>
                {PH_PRIMARY_IDS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-gray-700">First secondary ID</span>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={secondaryIdType1}
                  onChange={(e) => setSecondaryIdType1(e.target.value)}
                >
                  <option value="">Select…</option>
                  {PH_SECONDARY_IDS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Second secondary ID</span>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={secondaryIdType2}
                  onChange={(e) => setSecondaryIdType2(e.target.value)}
                >
                  <option value="">Select…</option>
                  {PH_SECONDARY_IDS.map(
                    (item) =>
                      item.id !== secondaryIdType1 && (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      )
                  )}
                </select>
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("path")}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveIdTypes}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Continue to photos"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "upload" ? (
        <div className="space-y-4">
          {showMobileQr && mobileUrl ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="font-semibold text-emerald-900">Continue on your phone</p>
              <p className="mt-1 text-sm text-emerald-800/90">
                No camera detected on this device. Scan the QR code with your phone to take photos
                and finish verification on mobile. This page updates automatically.
              </p>
              <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <QRCode value={mobileUrl} size={160} />
                </div>
                <div className="text-sm text-emerald-900">
                  <p className="font-medium">Or open this link on your phone:</p>
                  <a href={mobileUrl} className="mt-1 break-all underline">
                    {mobileUrl}
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {idPath === "primary" && primaryIdType ? (
            <KycDocumentSlot
              label={getPhIdType(primaryIdType)?.label ?? "Primary ID"}
              hint="Clear photo of the front. All corners visible, no glare."
              docType="primary_id"
              idCategory={primaryIdType}
              sessionId={session.id}
              kycToken={kycToken}
              uploaded={Boolean(primaryDoc)}
              documentId={primaryDoc?.id}
              onUploaded={refreshSession}
            />
          ) : null}

          {idPath === "secondary" ? (
            <>
              {secondaryIdType1 ? (
                <KycDocumentSlot
                  label={getPhIdType(secondaryIdType1)?.label ?? "Secondary ID 1"}
                  hint="Clear photo of the front. All corners visible."
                  docType="secondary_id_1"
                  idCategory={secondaryIdType1}
                  sessionId={session.id}
                  kycToken={kycToken}
                  uploaded={Boolean(secondary1Doc)}
                  documentId={secondary1Doc?.id}
                  onUploaded={refreshSession}
                />
              ) : null}
              {secondaryIdType2 ? (
                <KycDocumentSlot
                  label={getPhIdType(secondaryIdType2)?.label ?? "Secondary ID 2"}
                  hint="Must be a different ID from the first secondary document."
                  docType="secondary_id_2"
                  idCategory={secondaryIdType2}
                  sessionId={session.id}
                  kycToken={kycToken}
                  uploaded={Boolean(secondary2Doc)}
                  documentId={secondary2Doc?.id}
                  onUploaded={refreshSession}
                />
              ) : null}
            </>
          ) : null}

          <KycDocumentSlot
            label="Selfie holding your ID"
            hint="Your face and ID must both be readable in one photo."
            docType="selfie"
            sessionId={session.id}
            kycToken={kycToken}
            uploaded={Boolean(selfieDoc)}
            documentId={selfieDoc?.id}
            capture="user"
            onUploaded={refreshSession}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep("ids")}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!uploadComplete}
              onClick={() => setStep("review")}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Review & submit
            </button>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Review your submission</p>
            <ul className="mt-2 space-y-1">
              <li>
                • ID path: {idPath === "primary" ? "1 primary ID" : "2 secondary IDs"}
              </li>
              {idPath === "primary" && primaryIdType ? (
                <li>• {getPhIdType(primaryIdType)?.label}</li>
              ) : null}
              {idPath === "secondary" ? (
                <>
                  <li>• {getPhIdType(secondaryIdType1)?.label}</li>
                  <li>• {getPhIdType(secondaryIdType2)?.label}</li>
                </>
              ) : null}
              <li>• Selfie with ID attached</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submitVerification}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit verification"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
