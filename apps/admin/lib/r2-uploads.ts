/**
 * R2-backed uploads for the Cloudflare Workers deployment (admin.guma.one).
 *
 * Same bucket as the storefront (`gumakart-uploads`, binding `UPLOADS`):
 *   products/<tenantId>/<file>  — public product photos, served by kart.guma.one
 *                                 at /uploads/products/<tenantId>/<file>
 *   kyc/<tenantId>/<file>       — private; only ever streamed by /api/kyc/document
 *
 * Off Workers (local dev) the binding is absent and callers fall back to disk.
 * Keep in sync with apps/web/lib/r2-uploads.ts.
 */
import type { R2Bucket } from "@cloudflare/workers-types";

export async function getUploadsBucket(): Promise<R2Bucket | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as { UPLOADS?: R2Bucket };
    return env.UPLOADS ?? null;
  } catch {
    return null;
  }
}

export async function r2Get(key: string): Promise<{ body: ArrayBuffer; contentType?: string } | null> {
  const bucket = await getUploadsBucket();
  if (!bucket) return null;
  const obj = await bucket.get(key);
  if (!obj) return null;
  return { body: await obj.arrayBuffer(), contentType: obj.httpMetadata?.contentType };
}

export async function r2Put(key: string, body: ArrayBuffer | Uint8Array, contentType: string): Promise<boolean> {
  const bucket = await getUploadsBucket();
  if (!bucket) return false;
  await bucket.put(key, body, { httpMetadata: { contentType } });
  return true;
}
