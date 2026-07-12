import { NextResponse } from "next/server";
import { getStorefrontTenant } from "@/lib/get-storefront-tenant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const tenant = await getStorefrontTenant(tenantSlug);
  if (!tenant) {
    return new NextResponse("Not found", { status: 404 });
  }

  const seo = tenant.seo;
  const index = seo?.robots?.index !== false;
  const follow = seo?.robots?.follow !== false;
  const base =
    process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:3010";
  const host = `${base}/${tenant.slug}`;

  const lines = [
    "User-agent: *",
    index ? "Allow: /" : "Disallow: /",
    follow ? "" : "Disallow: /",
    ...(seo?.robots?.extraRules ?? []),
    `Sitemap: ${host}/sitemap.xml`,
  ].filter((line, i, arr) => line !== "" || arr[i - 1] !== "");

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
