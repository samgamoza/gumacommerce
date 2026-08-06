import { BRAND_PALETTES } from "./brand-kit";

/**
 * Brand Guard Slice B — deterministic Launch personalize validators.
 * Zero LLM. Allowlists curated BRAND_PALETTES (including ube / purple PH vibes).
 */

export type BrandGuardSeverity = "error" | "warn";

export interface BrandGuardIssue {
  field?: "tagline" | "promoTitle" | "promoSubtitle" | "paletteId" | "primaryColor" | "accentColor";
  code: string;
  severity: BrandGuardSeverity;
  message: string;
}

export interface BrandGuardPersonalizeInput {
  tagline?: string | null;
  promoTitle?: string | null;
  promoSubtitle?: string | null;
  paletteId?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
}

/** Explicit allowlist — intentional PH brand choices must not false-positive. */
export const BRAND_GUARD_PALETTE_ALLOWLIST = new Set(BRAND_PALETTES.map((p) => p.id));

const NOT_JUST_RE = /not just\s+.{1,40}\s*[—-]\s*it['’]?s/i;
const FABRICATED_STATS_RE =
  /\b(?:\d{1,3}(?:,\d{3})+|\d+k\+)\s+(?:sellers|shops|users|merchants|orders|customers)\b|\b(?:99\.9%|24\/7|100% satisfaction)\b/i;
const PURPLE_GLASS_DEFAULT_RE = /^#(?:6366f1|8b5cf6|7c3aed|a855f7|4f46e5)$/i;

export function lintBrandGuardCopy(
  text: string | null | undefined,
  field: BrandGuardIssue["field"]
): BrandGuardIssue[] {
  if (!text || !text.trim()) return [];
  const issues: BrandGuardIssue[] = [];
  if (NOT_JUST_RE.test(text)) {
    issues.push({
      field,
      code: "copy_not_just_trope",
      severity: "error",
      message: "Avoid “not just X — it’s Y” tropes. Say what the shop actually sells.",
    });
  }
  if (FABRICATED_STATS_RE.test(text)) {
    issues.push({
      field,
      code: "copy_fabricated_stats",
      severity: "error",
      message: "Avoid fabricated scale stats (10k+ users, 99.9%, 24/7) in Launch copy.",
    });
  }
  return issues;
}

/**
 * Soft hints for Launch UI — same patterns as hard rejects, plus softer nudges.
 * Safe to call on every keystroke (no LLM).
 */
export function hintBrandGuardCopy(text: string | null | undefined): string[] {
  if (!text || !text.trim()) return [];
  const hints: string[] = [];
  const hard = lintBrandGuardCopy(text, "tagline");
  for (const issue of hard) hints.push(issue.message);
  if (/\b(?:revolutionary|seamless|elevate your|unlock your|next-level)\b/i.test(text)) {
    hints.push("Sounds generic — try a concrete PH-market detail (barangay, product, price).");
  }
  if ((text.match(/[\u{1F300}-\u{1FAFF}]/gu) ?? []).length >= 4) {
    hints.push("Too many emoji can read as AI-slop — keep one or two max.");
  }
  return hints;
}

export function validateBrandGuardPersonalize(
  input: BrandGuardPersonalizeInput
): BrandGuardIssue[] {
  const issues: BrandGuardIssue[] = [];

  issues.push(...lintBrandGuardCopy(input.tagline, "tagline"));
  issues.push(...lintBrandGuardCopy(input.promoTitle, "promoTitle"));
  issues.push(...lintBrandGuardCopy(input.promoSubtitle, "promoSubtitle"));

  if (input.paletteId) {
    if (!BRAND_GUARD_PALETTE_ALLOWLIST.has(input.paletteId)) {
      issues.push({
        field: "paletteId",
        code: "palette_not_allowlisted",
        severity: "error",
        message: "Pick a curated Brand Guard palette (or leave palette blank for custom hex).",
      });
    }
    // Allowlisted palettes (including ube-cream) skip purple-default rejection.
    return issues;
  }

  // Custom hex without allowlisted paletteId: reject classic indigo/violet defaults.
  for (const [field, value] of [
    ["primaryColor", input.primaryColor],
    ["accentColor", input.accentColor],
  ] as const) {
    if (value && PURPLE_GLASS_DEFAULT_RE.test(value.trim())) {
      issues.push({
        field,
        code: "purple_glass_default",
        severity: "warn",
        message:
          "Indigo/violet defaults look like AI theme kits. Prefer a curated palette (ube is allowlisted) or a solid brand accent.",
      });
    }
  }

  return issues;
}

export function brandGuardHasErrors(issues: BrandGuardIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
