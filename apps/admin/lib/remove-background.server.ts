import { randomUUID } from "node:crypto";

/**
 * Production path: remove.bg API (serverless-safe, no model download).
 * Requires REMOVE_BG_API_KEY.
 */
async function removeBackgroundViaApi(
  input: Buffer,
  apiKey: string,
  options: Record<string, string> = { format: "png" }
): Promise<Buffer> {
  const form = new FormData();
  form.append("image_file", new Blob([new Uint8Array(input)]), "input");
  form.append("size", "auto");
  for (const [key, value] of Object.entries(options)) form.append(key, value);

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Background removal service failed (${res.status}). ${detail.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Dev fallback: local ONNX model via @imgly/background-removal-node, run in a
 * subprocess so the heavy model never gets bundled into the Next.js server.
 * Not suitable for serverless deploys — set REMOVE_BG_API_KEY there.
 */
/** Cutout on a white backdrop, cropped to the product with a margin, as JPEG — no local image library needed. */
export async function removeBackgroundToWhiteJpeg(input: Buffer, apiKey: string): Promise<Buffer> {
  return removeBackgroundViaApi(input, apiKey, {
    format: "jpg",
    bg_color: "ffffff",
    crop: "true",
    crop_margin: "8%",
  });
}

async function removeBackgroundViaLocalModel(input: Buffer): Promise<Buffer> {
  // Dev only — Node built-ins loaded lazily so the Workers bundle never needs them.
  const { spawn } = await import("node:child_process");
  const { unlink, writeFile, readFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const path = (await import("node:path")).default;
  const SCRIPT_PATH = path.join(process.cwd(), "scripts", "remove-bg.mjs");
  const id = randomUUID();
  const inputPath = path.join(tmpdir(), `guma-bg-${id}-in.png`);
  const outputPath = path.join(tmpdir(), `guma-bg-${id}-out.png`);

  await writeFile(inputPath, input);

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, [SCRIPT_PATH, inputPath, outputPath], {
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      });

      let stderr = "";
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderr.trim() || `Background removal failed (exit ${code}).`));
      });
    });

    return await readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => undefined);
    await unlink(outputPath).catch(() => undefined);
  }
}

export async function removeProductBackground(input: Buffer): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (apiKey) {
    return removeBackgroundViaApi(input, apiKey);
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Background removal needs REMOVE_BG_API_KEY in serverless deployments."
    );
  }
  return removeBackgroundViaLocalModel(input);
}
