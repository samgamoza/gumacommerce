import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <p className="text-4xl">🛒</p>
      <h1 className="mt-4 text-2xl font-bold">Shop not found</h1>
      <p className="mt-2 text-gray-500">This seller storefront doesn&apos;t exist yet.</p>
      <Link href="/" className="mt-6 text-emerald-600 underline">
        Back to Guma Commerce
      </Link>
    </div>
  );
}
