import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { unlink, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "remove-bg.mjs");

/**
 * Production path: remove.bg API (serverless-safe, no model download).
 * Requires REMOVE_BG_API_KEY.
 */
async function removeBackgroundViaApi(input: Buffer, apiKey: string): Promise<Buffer> {
  const form = new FormData();
  form.append("image_file", new Blob([new Uint8Array(input)], { type: "image/png" }), "input.png");
  form.append("size", "auto");
  form.append("format", "png");

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
async function removeBackgroundViaLocalModel(input: Buffer): Promise<Buffer> {
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
