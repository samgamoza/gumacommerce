import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function resolveWebUploadsRoot(): string {
  const candidates = [
    path.join(process.cwd(), "public/uploads/payment-proofs"),
    path.join(process.cwd(), "apps/web/public/uploads/payment-proofs"),
    path.join(__dirname, "../../public/uploads/payment-proofs"),
  ];
  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (existsSync(path.dirname(normalized))) {
      return normalized;
    }
  }
  return path.normalize(candidates[0]!);
}

/**
 * Saves a buyer payment screenshot (GCash/Maya receipt).
 * Uses Vercel Blob when configured; otherwise local public/uploads (dev).
 */
export async function savePaymentProofImage(input: {
  tenantSlug: string;
  orderNumber: string;
  file: File;
}): Promise<{ url: string; filename: string }> {
  const mime = input.file.type || "";
  const ext = MIME_TO_EXT[mime];
  if (!ext) {
    throw new Error("Use a JPG, PNG, WebP, or GIF screenshot.");
  }
  if (input.file.size > MAX_BYTES) {
    throw new Error("Screenshot must be 5 MB or smaller.");
  }

  const safeSlug = input.tenantSlug.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "shop";
  const safeOrder = input.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "order";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());

  if (blobEnabled()) {
    const blob = await put(`payment-proofs/${safeSlug}/${safeOrder}/${filename}`, buffer, {
      access: "public",
      contentType: mime,
      addRandomSuffix: false,
    });
    return { url: blob.url, filename };
  }

  const dir = path.join(resolveWebUploadsRoot(), safeSlug, safeOrder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return {
    filename,
    url: `/uploads/payment-proofs/${safeSlug}/${safeOrder}/${filename}`,
  };
}
