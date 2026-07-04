import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function getProductUploadDir(tenantId: string): string {
  return path.join(process.cwd(), "../web/public/uploads/products", tenantId);
}

export function getProductUploadPublicUrl(tenantId: string, filename: string): string {
  return `/uploads/products/${tenantId}/${filename}`;
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
  const dir = getProductUploadDir(tenantId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return {
    filename,
    url: getProductUploadPublicUrl(tenantId, filename),
  };
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

export async function readProductImageBuffer(tenantId: string, relativeUrl: string): Promise<Buffer> {
  return readFile(resolveProductUploadPath(tenantId, relativeUrl));
}

export async function saveEnhancedProductImage(
  tenantId: string,
  buffer: Buffer
): Promise<{ url: string; filename: string }> {
  const filename = `${randomUUID()}-enhanced.jpg`;
  const dir = getProductUploadDir(tenantId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return {
    filename,
    url: getProductUploadPublicUrl(tenantId, filename),
  };
}
