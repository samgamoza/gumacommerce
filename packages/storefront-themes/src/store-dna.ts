import type { ShopBusinessCategory } from "./shop-categories";
import type { ShopVibeId } from "./brand-kit";
import type { ShopTemplateId } from "./types";

export type ProductCountHint = "none" | "1-10" | "11-50" | "50+";
export type SellingChannel = "social" | "marketplace" | "in_person";
export type StoreGoal = "launch_fast" | "brand_look" | "conversion" | "live_selling";
export type LaunchStep = "dna" | "templates" | "personalize" | "preview" | "publish" | "done";

/** First-class business profile for GUMA Launch (deterministic, zero LLM). */
export interface StoreDNA {
  version: 1;
  businessName: string;
  category: string;
  vibe: ShopVibeId | string;
  audience?: string;
  productCountHint?: ProductCountHint;
  sellingChannels?: SellingChannel[];
  goals?: StoreGoal[];
  locale: "en" | "fil" | "taglish";
  derivedAt: string;
  launchStep?: LaunchStep;
  selectedTemplateId?: ShopTemplateId | string;
}

export function buildStoreDNA(input: {
  businessName: string;
  category?: string | null;
  vibe?: string | null;
  audience?: string;
  productCountHint?: ProductCountHint;
  sellingChannels?: SellingChannel[];
  goals?: StoreGoal[];
  locale?: StoreDNA["locale"];
  selectedTemplateId?: string;
  launchStep?: LaunchStep;
}): StoreDNA {
  return {
    version: 1,
    businessName: input.businessName.trim(),
    category: (input.category?.trim() || "General") as ShopBusinessCategory | string,
    vibe: input.vibe?.trim() || "fresh",
    audience: input.audience?.trim() || undefined,
    productCountHint: input.productCountHint,
    sellingChannels: input.sellingChannels,
    goals: input.goals,
    locale: input.locale ?? "taglish",
    derivedAt: new Date().toISOString(),
    launchStep: input.launchStep ?? "dna",
    selectedTemplateId: input.selectedTemplateId,
  };
}
