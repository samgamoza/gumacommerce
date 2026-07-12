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

  const base =
    process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:3010";
  const root = `${base}/${tenant.slug}`;
  const urls = [
    { loc: root, priority: "1.0" },
    ...tenant.products
      .filter((p) => p.slug)
      .map((p) => ({
        loc: `${root}/products/${p.slug}`,
        priority: "0.8",
      })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <changefreq>daily</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
