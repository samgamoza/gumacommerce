import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDownloadUrl, put } from "@vercel/blob";

const MAX_BYTES = 8 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function localKycDir(tenantId: string): string {
  return path.join(process.cwd(), ".data/kyc", tenantId);
}

function blobPathname(tenantId: string, filename: string): string {
  return `kyc/${tenantId}/${filename}`;
}

export async function saveKycImage(
  tenantId: string,
  file: File
): Promise<{ storageKey: string; mimeType: string }> {
  if (!MIME_TO_EXT[file.type]) {
    throw new Error("Use a JPG, PNG, or WebP photo.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Photo must be 8 MB or smaller.");
  }

  const ext = MIME_TO_EXT[file.type] ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (blobEnabled()) {
    const blob = await put(blobPathname(tenantId, filename), buffer, {
      access: "private",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return { storageKey: blob.url, mimeType: file.type };
  }

  const dir = localKycDir(tenantId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { storageKey: `local:${tenantId}/${filename}`, mimeType: file.type };
}

export async function readKycImageBuffer(storageKey: string): Promise<Buffer> {
  if (storageKey.startsWith("local:")) {
    const relative = storageKey.slice("local:".length);
    const [tenantId, ...rest] = relative.split("/");
    const filename = rest.join("/");
    if (!tenantId || !filename || filename.includes("..")) {
      throw new Error("Invalid storage key.");
    }
    return readFile(path.join(localKycDir(tenantId), filename));
  }

  if (storageKey.startsWith("http")) {
    const downloadUrl = await getDownloadUrl(storageKey);
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error("Could not load KYC document.");
    return Buffer.from(await res.arrayBuffer());
  }

  throw new Error("Invalid storage key.");
}
