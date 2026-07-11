import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <p className="text-4xl">🛒</p>
      <h1 className="mt-4 text-2xl font-bold">Shop not found</h1>
      <p className="mt-2 max-w-sm text-gray-500">
        This seller storefront doesn&apos;t exist yet. Check the URL — use your shop slug, not{" "}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">{"{slug}"}</code>.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/model"
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          View model store
        </Link>
        <Link
          href="/demo"
          className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Try demo shop
        </Link>
        <Link href="/" className="text-sm text-emerald-600 underline">
          Back to Guma Commerce
        </Link>
      </div>
    </div>
  );
}
