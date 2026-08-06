import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  isSafeUploadSegment,
  resolveWebPublicUploadsRoot,
  UPLOAD_MIME_BY_EXT,
} from "@/lib/local-uploads";

/** Same disk-serve pattern as product uploads — avoid cached App Router 404s. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  const segments = (await context.params).path ?? [];
  if (segments.length === 0 || segments.length > 6 || !segments.every(isSafeUploadSegment)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const proofsRoot = path.join(resolveWebPublicUploadsRoot(), "payment-proofs");
  const filePath = path.resolve(proofsRoot, ...segments);
  const rootResolved = path.resolve(proofsRoot) + path.sep;
  if (!filePath.startsWith(rootResolved)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const filename = segments[segments.length - 1] ?? "file.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": UPLOAD_MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
