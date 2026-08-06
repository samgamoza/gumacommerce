#!/usr/bin/env node
/**
 * Brand Guard CI scanner — dependency-free Node.
 * Scans React storefront ports for P0/P1 AI-slop tells (docs/PRIORITY-SCOPE-BRAND-GUARD.md §7).
 * Excludes reference/** raw HTML dumps.
 *
 * Usage: node scripts/brand-guard-scan.mjs
 * Exit 1 on any P0 hit; P1 hits print as warnings only.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCAN_ROOT = path.join(ROOT, "apps/web/components/storefront");

/** @typedef {{ id: string, severity: "P0" | "P1", message: string, re: RegExp }} Rule */

/** @type {Rule[]} */
const RULES = [
  {
    id: "indigo-violet-gradient",
    severity: "P0",
    message: "Indigo→violet / purple-glass default gradient (ban as auto default)",
    re: /(?:from|via|to)-(?:indigo|violet|purple)-(?:[4-9]00|950)|bg-gradient-[^\n]{0,80}(?:indigo|violet).*?(?:violet|purple|fuchsia)/i,
  },
  {
    id: "glass-glow-stack",
    severity: "P0",
    message: "Glassmorphism + glow card stack pattern",
    re: /backdrop-blur(?:-[a-z0-9]+)?[^\n]{0,120}(?:shadow-\[0_0_|shadow-.*glow|ring-.*(?:purple|violet|indigo).*\/\d+)/i,
  },
  {
    id: "inter-only-font",
    severity: "P0",
    message: "Inter as sole identity font on a new port",
    re: /(?:fontFamily\s*[:=]\s*["'`]Inter["'`]|from ["']next\/font\/google["'][\s\S]{0,200}\bInter\b(?![\s\S]{0,200}\b(?:Bricolage|Geist|Playfair|DM_Sans|Space_Grotesk|Outfit|Sora)\b))/m,
  },
  {
    id: "not-just-trope",
    severity: "P0",
    message: "AI copy trope: “not just X — it's Y”",
    re: /not just\s+[^—\n-]{1,40}\s*[—-]\s*it['’]?s/i,
  },
  {
    id: "fabricated-stats",
    severity: "P0",
    message: "Fabricated vanity stats (10k+ / 99.9% scale claims)",
    re: /\b(?:10k\+|50k\+|100k\+|99\.9%)\b|\btrusted by\s+\d/i,
  },
  {
    id: "always-on-support-claim",
    severity: "P1",
    message: "24/7 claim — OK for real service copy; prefer concrete hours when unsure",
    re: /\b24\/7\b/,
  },
  {
    id: "gradient-clip-headline",
    severity: "P1",
    message: "Gradient-clip headline (prefer solid ink + scale)",
    re: /bg-clip-text\s+text-transparent/,
  },
  {
    id: "oversized-shadow",
    severity: "P1",
    message: "Oversized multi-layer shadow / nested card tell",
    re: /shadow-2xl[^\n]{0,80}shadow-2xl|shadow-\[0_25px_50px|drop-shadow-2xl/,
  },
];

const EXT_RE = /\.(tsx|ts|jsx|js|css)$/i;

async function walk(dir) {
  /** @type {string[]} */
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      console.error(`[brand-guard] Scan root missing: ${dir}`);
      process.exit(2);
    }
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "reference") continue;
      out.push(...(await walk(full)));
    } else if (EXT_RE.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function lineOf(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

async function main() {
  const info = await stat(SCAN_ROOT);
  if (!info.isDirectory()) {
    console.error(`[brand-guard] Not a directory: ${SCAN_ROOT}`);
    process.exit(2);
  }

  const files = await walk(SCAN_ROOT);
  /** @type {Array<{ severity: string, id: string, file: string, line: number, message: string }>} */
  const hits = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let match;
      const re = new RegExp(rule.re.source, rule.re.flags.includes("g") ? rule.re.flags : `${rule.re.flags}g`);
      while ((match = re.exec(content)) !== null) {
        hits.push({
          severity: rule.severity,
          id: rule.id,
          file: path.relative(ROOT, file).replace(/\\/g, "/"),
          line: lineOf(content, match.index),
          message: rule.message,
        });
        if (match[0].length === 0) re.lastIndex += 1;
      }
    }
  }

  const p0 = hits.filter((h) => h.severity === "P0");
  const p1 = hits.filter((h) => h.severity === "P1");

  console.log(`[brand-guard] Scanned ${files.length} files under apps/web/components/storefront`);
  console.log(`[brand-guard] P0 hits: ${p0.length} · P1 hits: ${p1.length}`);

  for (const hit of hits) {
    const tag = hit.severity === "P0" ? "FAIL" : "WARN";
    console.log(`${tag} ${hit.severity} ${hit.id} ${hit.file}:${hit.line} — ${hit.message}`);
  }

  if (p0.length > 0) {
    console.error(
      `\n[brand-guard] ${p0.length} P0 tell(s) — fix before marking a Free Bundle entry integrated.`
    );
    process.exit(1);
  }

  console.log("[brand-guard] Clean (no P0 tells).");
  process.exit(0);
}

main().catch((err) => {
  console.error("[brand-guard] Scanner crashed:", err);
  process.exit(2);
});
