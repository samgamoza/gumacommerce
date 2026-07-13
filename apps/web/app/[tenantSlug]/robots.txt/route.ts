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
  const base =
    process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:3010";
  const host = `${base}/${tenant.slug}`;

  const lines = [
    "User-agent: *",
    index ? "Allow: /" : "Disallow: /",
    ...(seo?.robots?.extraRules ?? []),
    `Sitemap: ${host}/sitemap.xml`,
  ];

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
