"use client";

import { useEffect } from "react";

export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[order page]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-xl font-bold text-neutral-900">Couldn’t load this order</h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        Your checkout may still have succeeded. Refresh this page, or open Orders from your shop
        link again.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
