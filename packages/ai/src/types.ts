export type AiTone = "friendly_taglish" | "professional_en" | "gen_z_taglish";

export interface SellerContext {
  brandName: string;
  category: string;
  location: string;
  tone: AiTone;
  audience: string;
  orderLink: string;
}

export type TemplateKey =
  | "tiktok_package"
  | "social_post"
  | "product_listing"
  | "campaign_strategy"
  | "support_chatbot";

export interface GenerateInput {
  templateKey: TemplateKey;
  userPrompt: string;
  seller: SellerContext;
  variables?: Record<string, string>;
  subscriptionPlan?: string | null;
  taskType?: "agent_post" | "agent_campaign" | "chat" | "generation";
  /** Tenant's month-to-date token usage; over-budget tenants degrade to the cheapest model. */
  tokensUsedThisMonth?: number;
}

export interface GenerateResult {
  templateKey: TemplateKey;
  output: unknown;
  model: string;
  tokensUsed?: number;
}
