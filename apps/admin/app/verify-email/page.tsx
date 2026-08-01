"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@guma-commerce/ui";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setMessage("Email verified! Redirecting to your dashboard...");
          setTimeout(() => {
            router.push(data.redirectTo ?? "/");
            router.refresh();
          }, 1500);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong.");
      });
  }, [token, router]);

  return (
    <AuthLayout title="Email verification" subtitle="Confirming your Guma One account">
      <div className="text-center">
        <p
          className={`text-sm ${
            status === "success"
              ? "text-emerald-700"
              : status === "error"
                ? "text-red-600"
                : "text-gray-600"
          }`}
        >
          {message}
        </p>
        {status === "error" && (
          <Link href="/onboarding" className="mt-6 inline-block">
            <Button>Back to onboarding</Button>
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
