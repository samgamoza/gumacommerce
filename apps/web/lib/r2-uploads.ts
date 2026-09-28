/**
 * R2-backed uploads for the Cloudflare Workers deployment (kart.guma.one).
 *
 * On Workers there is no writable disk, so payment proofs and product photos
 * live in the `gumakart-uploads` R2 bucket (binding `UPLOADS`, see wrangler.jsonc).
 * Object keys mirror the old on-disk layout under public/uploads/, so URLs are
 * unchanged:  /uploads/products/<tenantId>/<file>  ->  products/<tenantId>/<file>.
 *
 * Off Workers (Proxmox CT, local dev) the binding is absent and callers fall
 * back to the filesystem paths they used before.
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
