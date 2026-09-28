import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  isSafeUploadSegment,
  resolveWebPublicUploadsRoot,
  UPLOAD_MIME_BY_EXT,
} from "@/lib/local-uploads";
import { r2Get } from "@/lib/r2-uploads";

/**
 * Serve seller product images from local disk at request time.
 *
 * Why this exists: with a root `[tenantSlug]` route, newly uploaded files under
 * `public/uploads/...` can miss Next's static file map and get a cached App Router
 * 404 until process restart. A dedicated route always reads the filesystem.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ tenantId: string; filename: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { tenantId, filename } = await context.params;

  if (!isSafeUploadSegment(tenantId) || !isSafeUploadSegment(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Cloudflare Workers: objects live in R2 under the same path.
  const r2 = await r2Get(`products/${tenantId}/${filename}`);
  if (r2) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    return new NextResponse(r2.body, {
      headers: {
        "Content-Type": r2.contentType ?? UPLOAD_MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  const productsRoot = path.join(resolveWebPublicUploadsRoot(), "products");
  const filePath = path.resolve(productsRoot, tenantId, filename);
  const rootResolved = path.resolve(productsRoot) + path.sep;
  if (!filePath.startsWith(rootResolved)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": UPLOAD_MIME_BY_EXT[ext] ?? "application/octet-stream",
        // UUIDs in filenames — safe to cache; new uploads get new URLs.
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
