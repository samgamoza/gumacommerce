import { readFileSync, writeFileSync } from "node:fs";
import { removeBackground } from "@imgly/background-removal-node";

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error("Usage: node remove-bg.mjs <input.png> <output.png>");
  process.exit(1);
}

const input = readFileSync(inputPath);
const blob = new Blob([Uint8Array.from(input)], { type: "image/png" });
const result = await removeBackground(blob, {
  model: "medium",
  output: { format: "image/png", quality: 0.92 },
});

writeFileSync(outputPath, Buffer.from(await result.arrayBuffer()));
