"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthError,
  AuthField,
  AuthLayout,
  AuthSubmitButton,
  authInputClassName,
} from "@/components/auth-layout";
import { VibePicker } from "@/components/vibe-picker";
import { shopUrlDisplayPrefix } from "@/lib/utils";
import {
  DEFAULT_SHOP_BUSINESS_CATEGORY,
  SHOP_BUSINESS_CATEGORIES,
} from "@guma-commerce/storefront-themes";

const CATEGORIES = SHOP_BUSINESS_CATEGORIES;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function GoogleShopSetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    shopName: "",
    shopSlug: "",
    category: DEFAULT_SHOP_BUSINESS_CATEGORY,
    vibe: "",
  });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          router.replace("/login");
          return;
        }
        if (!data.user?.needsShopSetup) {
          router.replace("/");
          return;
        }
        setEmail(data.user.email);
      })
      .finally(() => setCheckingSession(false));
  }, [router]);

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/google/complete-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Could not create shop.");
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

  if (checkingSession) {
    return (
      <AuthLayout title="Setting up your shop" subtitle="Loading your Google account...">
        <p className="text-center text-sm text-gray-500">Please wait...</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Name your shop"
      subtitle={`Signed in as ${email}. Choose your storefront URL to finish signup.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />

        <AuthField label="Shop name" id="shopName">
          <input
            id="shopName"
            required
            value={form.shopName}
            onChange={(e) => setForm((current) => ({ ...current, shopName: e.target.value }))}
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
                setForm((current) => ({
                  ...current,
                  shopSlug: slugify(e.target.value),
                }));
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
            onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
            className={authInputClassName}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </AuthField>

        <VibePicker
          value={form.vibe}
          onChange={(vibe) => setForm((current) => ({ ...current, vibe }))}
        />

        <AuthSubmitButton loading={loading}>Create my shop</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}
