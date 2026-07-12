import { mkdir, readFile, writeFile } from "node:fs/promises";
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
};

/**
 * Object storage (Vercel Blob) is used whenever BLOB_READ_WRITE_TOKEN is set.
 * Local disk under apps/web/public is only a dev fallback — serverless
 * filesystems are ephemeral, so production must use Blob.
 */
function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobPathname(tenantId: string, filename: string): string {
  return `products/${tenantId}/${filename}`;
}

/** Resolve apps/web/public/uploads/products regardless of process.cwd() (admin vs turbo root). */
function resolveWebUploadsRoot(): string {
  const candidates = [
    path.join(process.cwd(), "apps/web/public/uploads/products"),
    path.join(process.cwd(), "../web/public/uploads/products"),
    path.join(process.cwd(), "../../apps/web/public/uploads/products"),
    path.join(__dirname, "../../../web/public/uploads/products"),
  ];
  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (existsSync(path.dirname(normalized))) {
      return normalized;
    }
  }
  return path.normalize(candidates[1]!);
}

export function getProductUploadDir(tenantId: string): string {
  return path.join(resolveWebUploadsRoot(), tenantId);
}

export function getProductUploadPublicUrl(tenantId: string, filename: string): string {
  return `/uploads/products/${tenantId}/${filename}`;
}

async function storeBuffer(
  tenantId: string,
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<{ url: string; filename: string }> {
  if (blobEnabled()) {
    const blob = await put(blobPathname(tenantId, filename), buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url, filename };
  }

  const dir = getProductUploadDir(tenantId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { filename, url: getProductUploadPublicUrl(tenantId, filename) };
}

export async function saveProductImage(
  tenantId: string,
  file: File
): Promise<{ url: string; filename: string }> {
  if (!MIME_TO_EXT[file.type]) {
    throw new Error("Use a JPG, PNG, WebP, or GIF image.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const ext = MIME_TO_EXT[file.type];
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  return storeBuffer(tenantId, filename, buffer, file.type);
}

function assertTenantOwnsImage(tenantId: string, imageUrl: string): void {
  if (imageUrl.startsWith("http")) {
    // Blob URLs keep the pathname we wrote: products/<tenantId>/<file>
    const pathname = new URL(imageUrl).pathname;
    if (!pathname.includes(`/products/${tenantId}/`)) {
      throw new Error("Image must belong to your shop.");
    }
    return;
  }
  if (!imageUrl.startsWith(`/uploads/products/${tenantId}/`)) {
    throw new Error("Image must belong to your shop.");
  }
}

export function resolveProductUploadPath(tenantId: string, relativeUrl: string): string {
  const prefix = `/uploads/products/${tenantId}/`;
  if (!relativeUrl.startsWith(prefix)) {
    throw new Error("Image must belong to your shop.");
  }
  const filename = relativeUrl.slice(prefix.length);
  if (!filename || filename.includes("..")) {
    throw new Error("Invalid image path.");
  }
  return path.join(getProductUploadDir(tenantId), filename);
}

export async function readProductImageBuffer(
  tenantId: string,
  imageUrl: string
): Promise<Buffer> {
  assertTenantOwnsImage(tenantId, imageUrl);

  if (imageUrl.startsWith("http")) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("Could not load the original image.");
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(resolveProductUploadPath(tenantId, imageUrl));
}

export async function saveEnhancedProductImage(
  tenantId: string,
  buffer: Buffer
): Promise<{ url: string; filename: string }> {
  const filename = `${randomUUID()}-enhanced.jpg`;
  return storeBuffer(tenantId, filename, buffer, "image/jpeg");
}
