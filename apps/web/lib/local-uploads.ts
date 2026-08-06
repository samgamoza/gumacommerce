import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Resolve apps/web/public/uploads regardless of process.cwd()
 * (turbo root vs apps/web).
 */
export function resolveWebPublicUploadsRoot(): string {
  const candidates = [
    path.join(process.cwd(), "public/uploads"),
    path.join(process.cwd(), "apps/web/public/uploads"),
    path.join(__dirname, "../../public/uploads"),
  ];
  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (existsSync(normalized) || existsSync(path.dirname(normalized))) {
      return normalized;
    }
  }
  return path.normalize(candidates[0]!);
}

export const UPLOAD_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Reject path traversal and empty segments. */
export function isSafeUploadSegment(segment: string): boolean {
  return Boolean(
    segment &&
      !segment.includes("..") &&
      !segment.includes("/") &&
      !segment.includes("\\") &&
      !segment.includes("\0")
  );
}
