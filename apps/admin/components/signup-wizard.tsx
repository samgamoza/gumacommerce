"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthError,
  AuthField,
  AuthLayout,
  AuthSubmitButton,
  authInputClassName,
} from "@/components/auth-layout";
import { PasswordInput } from "@/components/password-input";
import { AuthDivider, GoogleSignInButton } from "@/components/google-sign-in-button";
import { shopUrlDisplayPrefix } from "@/lib/utils";

const CATEGORIES = [
  "Food & Beverage",
  "Fashion & Apparel",
  "Beauty & Skincare",
  "Handmade & Crafts",
  "Electronics",
  "General",
];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function SignupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    shopName: "",
    shopSlug: "",
    category: "Food & Beverage",
  });

  useEffect(() => {
    if (slugEdited || !form.shopName) return;
    setForm((current) => ({ ...current, shopSlug: slugify(current.shopName) }));
  }, [form.shopName, slugEdited]);

  useEffect(() => {
    if (form.shopSlug.length < 3) {
      setSlugStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/auth/check-slug?slug=${encodeURIComponent(form.shopSlug)}`);
      const data = await res.json();
      setSlugStatus(data.available ? "available" : data.reason ?? "Unavailable");
    }, 400);

    return () => clearTimeout(timer);
  }, [form.shopSlug]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Signup failed.");
        return;
      }

      router.push(data.redirectTo ?? "/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Start your shop free"
      subtitle={
        step === 1
          ? "Step 1 of 2 — Sign up with Google or email"
          : "Step 2 of 2 — Set up your storefront"
      }
    >
      {step === 1 && (
        <>
          <GoogleSignInButton intent="signup" label="Sign up with Google" />
          <AuthDivider />
        </>
      )}

      <div className="mb-6 flex gap-2">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${step >= n ? "bg-emerald-500" : "bg-gray-200"}`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />

        {step === 1 ? (
          <>
            <AuthField label="Your name" id="displayName">
              <input
                id="displayName"
                required
                value={form.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                className={authInputClassName}
                placeholder="Maria Santos"
              />
            </AuthField>

            <AuthField label="Email" id="email">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={authInputClassName}
                placeholder="you@example.com"
              />
            </AuthField>

            <AuthField label="Password" id="password">
              <PasswordInput
                id="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="At least 8 characters"
              />
            </AuthField>
          </>
        ) : (
          <>
            <AuthField label="Shop name" id="shopName">
              <input
                id="shopName"
                required
                value={form.shopName}
                onChange={(e) => updateField("shopName", e.target.value)}
                className={authInputClassName}
                placeholder="Halo Queen Manila"
              />
            </AuthField>

            <AuthField label="Shop URL" id="shopSlug">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-gray-400">{shopUrlDisplayPrefix()}</span>
                <input
                  id="shopSlug"
                  required
                  value={form.shopSlug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    updateField("shopSlug", slugify(e.target.value));
                  }}
                  className={authInputClassName}
                  placeholder="halo-queen"
                />
              </div>
              {slugStatus && (
                <p
                  className={`mt-1.5 text-xs ${
                    slugStatus === "available" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {slugStatus === "available" ? "✓ Available" : slugStatus}
                </p>
              )}
            </AuthField>

            <AuthField label="Category" id="category">
              <select
                id="category"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={authInputClassName}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </AuthField>
          </>
        )}

        <div className="flex gap-2 pt-2">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-11 flex-1 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <div className={step === 2 ? "flex-1" : "w-full"}>
            <AuthSubmitButton loading={loading}>
              {step === 1 ? "Continue" : "Create my shop"}
            </AuthSubmitButton>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
