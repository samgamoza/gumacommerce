import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { unlink, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "remove-bg.mjs");

export async function removeProductBackground(input: Buffer): Promise<Buffer> {
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
