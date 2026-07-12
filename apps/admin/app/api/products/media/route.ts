import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { getProductUploadDir } from "@/lib/product-uploads";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Serve a tenant-owned local product upload through the admin app so
 * previews work even when the storefront (3010) is down or misconfigured.
 * Absolute Blob URLs are not proxied — the client loads them directly.
 */
export async function GET(request: Request) {
  try {
    const session = await requireTenantSession();
    const url = new URL(request.url);
    const relative = url.searchParams.get("path") ?? "";

    const prefix = `/uploads/products/${session.tenantId}/`;
    if (!relative.startsWith(prefix)) {
      return NextResponse.json({ ok: false, error: "Invalid image path." }, { status: 400 });
    }

    const filename = relative.slice(prefix.length);
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ ok: false, error: "Invalid image path." }, { status: 400 });
    }

    const filePath = path.join(getProductUploadDir(session.tenantId), filename);
    const buffer = await readFile(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return NextResponse.json({ ok: false, error: "Image not found." }, { status: 404 });
    }
    console.error("[products/media GET]", error);
    return NextResponse.json({ ok: false, error: "Could not load image." }, { status: 500 });
  }
}
