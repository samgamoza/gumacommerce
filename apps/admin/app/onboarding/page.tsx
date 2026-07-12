"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { Button, Card } from "@guma-commerce/ui";

interface SessionUser {
  tenantSlug: string;
  tenantName: string;
  email: string;
  emailVerified: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setUser(data.user);
        // Handbook flow: Launch is the primary onboarding surface.
        if (data.ok) router.replace("/launch");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function resendVerification() {
    setResendMessage(null);
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setResendMessage(
      data.ok
        ? "Verification link sent. Check your terminal logs in development."
        : data.error ?? "Could not send verification email."
    );
  }

  if (loading) {
    return (
      <PatternAdminShell title="Welcome">
        <p className="text-gray-500">Loading...</p>
      </PatternAdminShell>
    );
  }

  const storefrontUrl =
    process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3010";

  return (
    <PatternAdminShell title="Welcome to Guma Commerce">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <h2 className="text-lg font-semibold">🎉 Your shop is created!</h2>
          <p className="mt-2 text-sm text-gray-600">
            <strong>{user?.tenantName}</strong> will be public at{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              {storefrontUrl}/{user?.tenantSlug}
            </code>{" "}
            after you add a product and activate from the dashboard.
          </p>
        </Card>

        {!user?.emailVerified ? (
          <Card>
            <h3 className="font-semibold">Verify your email</h3>
            <p className="mt-2 text-sm text-gray-600">
              We sent a verification link to <strong>{user?.email}</strong>. In local development,
              check the terminal running the admin app for the link.
            </p>
            <Button className="mt-4" onClick={resendVerification}>
              Resend verification link
            </Button>
            {resendMessage && <p className="mt-2 text-sm text-emerald-700">{resendMessage}</p>}
          </Card>
        ) : (
          <Card>
            <h3 className="font-semibold">Email verified</h3>
            <p className="mt-2 text-sm text-gray-600">
              Your email is confirmed via Google or the verification link.
            </p>
          </Card>
        )}

        <Card>
          <h3 className="font-semibold">Next steps</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li className="flex gap-2">
              <span>✅</span>
              <span>Account and shop created</span>
            </li>
            <li className="flex gap-2">
              <span>{user?.emailVerified ? "✅" : "⬜"}</span>
              <span>Verify your email address</span>
            </li>
            <li className="flex gap-2">
              <span>⬜</span>
              <span>
                <Link href="/products" className="text-emerald-700 hover:underline">
                  Add your first product
                </Link>
              </span>
            </li>
            <li className="flex gap-2">
              <span>⬜</span>
              <span>Activate your shop from the dashboard</span>
            </li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/launch">
              <Button>Continue GUMA Launch</Button>
            </Link>
            <a href={`${storefrontUrl}/${user?.tenantSlug}?preview=1`} target="_blank" rel="noreferrer">
              <Button variant="secondary">Preview storefront</Button>
            </a>
          </div>
        </Card>
      </div>
    </PatternAdminShell>
  );
}
