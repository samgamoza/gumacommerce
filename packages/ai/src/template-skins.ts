/**
 * Ops Template Intel — AI-curated storefront skins (cheap model, JSON only).
 * Does not invent new React templates; outputs look packs for existing live renderers.
 */
import { z } from "zod";
import { THRIFTY_MODEL } from "./plan-limits";
import { callLlm, resolveEffectiveModel } from "./providers/llm";

const LOOK_HEROS = ["circle", "split", "stack"] as const;
const LOOK_ON_OFF = ["on", "off"] as const;
const LOOK_COLS = ["2", "3"] as const;
const LOOK_TYPE = ["classic", "bold", "soft"] as const;
const LOOK_RADIUS_TONE = ["soft", "sharp"] as const;
const FONTS = ["bricolage", "system", "mono-accent"] as const;
const RADII = ["0.375rem", "0.85rem", "1.35rem", "0.15rem"] as const;

/** Keep in sync with storefront-themes STOCK_VISIBLE / BRAND_PALETTES ids. */
export const AI_SKIN_PALETTE_IDS = [
  "manila-sunset",
  "midnight-neon",
  "dragonfruit",
  "island-blue",
  "ube-cream",
  "coral-reef",
  "mango-royale",
  "cyber-grape",
  "espresso",
  "electric-lime",
  "bubblegum",
  "taho-caramel",
] as const;

const AiSkinSchema = z.object({
  label: z.string().min(2).max(80),
  paletteId: z.string().min(2).max(40),
  displayFont: z.enum(FONTS).optional(),
  radius: z.string().optional(),
  heroLayout: z.enum(LOOK_HEROS).optional(),
  marquee: z.enum(LOOK_ON_OFF).optional(),
  floatCards: z.enum(LOOK_ON_OFF).optional(),
  menuColumns: z.enum(LOOK_COLS).optional(),
  typeScale: z.enum(LOOK_TYPE).optional(),
  radiusTone: z.enum(LOOK_RADIUS_TONE).optional(),
  notes: z.string().max(240).optional(),
});

const AiSkinBatchSchema = z.object({
  skins: z.array(AiSkinSchema).min(1).max(10),
});

export type AiCuratedSkinDraft = z.infer<typeof AiSkinSchema>;

export type CurateTemplateSkinsInput = {
  categoryLabel: string;
  liveTemplateId: string;
  count: number;
  /** Labels already in stock — model should avoid clones. */
  avoidLabels?: string[];
};

export type CurateTemplateSkinsResult = {
  skins: AiCuratedSkinDraft[];
  model: string;
  provider: string;
  /** true when no LLM key / mock — still usable drafts */
  fallback: boolean;
};

function pick<T>(items: readonly T[], index: number): T {
  return items[((index % items.length) + items.length) % items.length]!;
}

/** Deterministic skins when LLM unavailable — keeps ops flow unblocked. */
export function fallbackTemplateSkins(input: CurateTemplateSkinsInput): AiCuratedSkinDraft[] {
  const count = Math.max(1, Math.min(10, input.count));
  const out: AiCuratedSkinDraft[] = [];
  for (let i = 0; i < count; i += 1) {
    const paletteId = pick(AI_SKIN_PALETTE_IDS, i);
    out.push({
      label: paletteId
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      paletteId,
      displayFont: pick(FONTS, i),
      radius: pick(RADII, i),
      heroLayout: pick(LOOK_HEROS, i),
      marquee: pick(LOOK_ON_OFF, i + 1),
      floatCards: pick(LOOK_ON_OFF, i),
      menuColumns: pick(LOOK_COLS, i),
      typeScale: pick(LOOK_TYPE, i),
      radiusTone: pick(LOOK_RADIUS_TONE, i),
      notes: `Fallback skin (no LLM). Base renderer: ${input.liveTemplateId}.`,
    });
  }
  return out;
}

function normalizePaletteId(raw: string, index: number): string {
  const id = raw.trim().toLowerCase().replace(/\s+/g, "-");
  if ((AI_SKIN_PALETTE_IDS as readonly string[]).includes(id)) return id;
  return pick(AI_SKIN_PALETTE_IDS, index);
}

export function parseAiSkinBatch(content: string, count: number): AiCuratedSkinDraft[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned non-JSON skin batch.");
    parsed = JSON.parse(match[0]);
  }
  const batch = AiSkinBatchSchema.parse(parsed);
  return batch.skins.slice(0, count).map((skin, index) => ({
    ...skin,
    label: skin.label.trim().slice(0, 80),
    paletteId: normalizePaletteId(skin.paletteId, index),
    notes: skin.notes?.trim().slice(0, 240),
  }));
}

const SYSTEM = `You are Guma One Template Intelligence — ops skin curator for Philippine SMB storefronts.
Return ONLY valid JSON. Never invent new page layouts or React components.
You only propose VISUAL SKINS (palette + type + radius + Sarab-style look knobs) for an existing live renderer.
Skins in one batch must be obviously different from each other (no two similar teals).
Prefer high-contrast paletteIds from the allowed list.
Labels should be short, seller-friendly (e.g. "Warm Amber Repair", "Cool Indigo Clinic").`;

export async function curateTemplateSkins(
  input: CurateTemplateSkinsInput
): Promise<CurateTemplateSkinsResult> {
  const count = Math.max(1, Math.min(10, input.count));
  const avoid = (input.avoidLabels ?? []).slice(0, 24).join(", ") || "(none)";

  const user = `Category: ${input.categoryLabel}
Live renderer (do not change): ${input.liveTemplateId}
How many skins: ${count}
Avoid these existing labels: ${avoid}

Allowed paletteId values (pick only from this list):
${AI_SKIN_PALETTE_IDS.join(", ")}

Allowed displayFont: ${FONTS.join(", ")}
Allowed radius: ${RADII.join(", ")}
Allowed heroLayout: ${LOOK_HEROS.join(", ")}
Allowed marquee / floatCards: on|off
Allowed menuColumns: 2|3
Allowed typeScale: classic|bold|soft
Allowed radiusTone: soft|sharp

Respond with JSON:
{"skins":[{"label":"...","paletteId":"...","displayFont":"...","radius":"...","heroLayout":"...","marquee":"...","floatCards":"...","menuColumns":"...","typeScale":"...","radiusTone":"...","notes":"..."}]}`;

  try {
    const model = resolveEffectiveModel(THRIFTY_MODEL);
    if (model === "mock") {
      const skins = fallbackTemplateSkins({ ...input, count });
      return { skins, model: "mock", provider: "mock", fallback: true };
    }

    const llm = await callLlm({
      model,
      system: SYSTEM,
      user,
      jsonMode: true,
      maxTokens: 1200,
    });

    const skins = parseAiSkinBatch(llm.content, count);
    return {
      skins,
      model: llm.model,
      provider: llm.provider,
      fallback: false,
    };
  } catch (error) {
    const skins = fallbackTemplateSkins({ ...input, count });
    return {
      skins,
      model: THRIFTY_MODEL,
      provider: "mock",
      fallback: true,
    };
  }
}
