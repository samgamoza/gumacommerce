import type { SellerContext } from "../types";

export const MASTER_SYSTEM_PROMPT = (seller: SellerContext) => `
You are Guma One AI, an expert Philippine social commerce marketing assistant specializing in Guma-style premium branding and video-first campaigns.
You understand Filipino consumer behavior, Taglish social media tone, Metro Manila and
provincial market differences, and high-converting e-commerce copy for mobile users.

Rules:
- Currency: PHP (₱), use comma separators (₱1,299)
- Always include a clear CTA with the order link: ${seller.orderLink}
- Respect DTI/NPC guidelines: no false claims, show final price hints
- Default tone: ${seller.tone}
- Target audience: ${seller.audience}
- Seller brand: ${seller.brandName} | Category: ${seller.category} | Location: ${seller.location}
- Output valid JSON matching the requested schema
- For food: mention serving size, allergens if provided, prep time
- For promos: include start/end dates in PH timezone (Asia/Manila)
`.trim();

export const TIKTOK_PACKAGE_PROMPT = (vars: Record<string, string>) => `
Task: Create a viral TikTok marketing package.

Product: ${vars.product_name ?? "Product"}
Description: ${vars.product_description ?? ""}
Price: ₱${vars.price ?? "0"}
Promo: ${vars.promo_details ?? "None"}
Target: ${vars.audience ?? "Gen Z"} in ${vars.location ?? "Metro Manila"}
Duration: ${vars.video_length ?? "30"} seconds

Return JSON:
{
  "hook_options": ["3 opening hooks, first 2 seconds"],
  "script": {
    "voiceover": "full Taglish script with timestamps",
    "on_screen_text": ["text overlays per scene"],
    "shot_list": [{"scene": 1, "visual": "...", "duration_sec": 3}]
  },
  "caption": "TikTok caption with emojis",
  "hashtags": ["#tag1", "#tag2"],
  "carousel_slides": [{"headline": "...", "body": "...", "cta": "Order Now"}],
  "posting_tips": ["best time", "sound suggestion", "engagement tactic"],
  "order_cta": "Tap link sa bio — ${vars.order_link ?? ""}"
}
`.trim();

export const SOCIAL_POST_PROMPT = (vars: Record<string, string>) => `
Task: Create a high-converting ${vars.platform ?? "Facebook"} post.

Campaign goal: ${vars.goal ?? "conversion"}
Products: ${vars.product_list_json ?? "[]"}
Brand voice: ${vars.tone ?? "friendly_taglish"}

Return JSON:
{
  "primary_text": "main caption, max 3 short paragraphs",
  "headline": "for ads if applicable",
  "hashtags": [],
  "story_variant": "shorter version for Stories",
  "comment_pinned": "seller pinned comment with link",
  "visual_brief": "describe ideal photo/video",
  "order_link_with_utm": "${vars.order_link ?? ""}?utm_source=${vars.platform ?? "facebook"}"
}
`.trim();

export const PRODUCT_LISTING_PROMPT = (vars: Record<string, string>) => `
Task: Create a complete product listing for Philippine mobile social commerce.

Shop brand: ${vars.brand_name ?? ""}
Shop category (STRICT): ${vars.category ?? "General"}
Product name / notes: ${vars.product_name ?? ""}
Raw notes: ${vars.seller_notes ?? ""}

Rules:
- Stay inside the shop category. If category is Printing & Signage, write for print/signage products (tarpaulin, cards, stickers, acrylic, etc.) — NEVER invent food, cakes, drinks, or unrelated niches.
- If the seller notes conflict with the category, reinterpret them as a product that fits the category or ask via customization_questions — do not switch verticals.
- Use Philippine peso pricing and Taglish-friendly, mobile-first copy.

Return JSON:
{
  "title": "max 80 chars",
  "slug": "url-friendly",
  "description_html": "benefits-first HTML",
  "short_description": "1-2 lines",
  "variants": [{"name": "Size", "options": [{"label": "Regular", "price_adjustment": 0, "sku": "REG"}]}],
  "suggested_price": 999,
  "compare_at_price": null,
  "tags": [],
  "seo_keywords": [],
  "customization_questions": [],
  "photo_shot_list": ["hero shot", "lifestyle"],
  "social_proof_prompt": "ask seller for review caption"
}
`.trim();

export const CAMPAIGN_STRATEGY_PROMPT = (vars: Record<string, string>) => `
Task: Design a 7-day marketing campaign for a Philippine social seller.

Seller: ${vars.brand_name ?? ""}
Products: ${vars.products_json ?? "[]"}
Goal: ${vars.goal ?? "increase orders"}
Occasion: ${vars.occasion ?? "payday sale"}

Return JSON:
{
  "campaign_name": "...",
  "daily_plan": [{"day": 1, "theme": "...", "posts": [], "promo": "...", "channel": "tiktok"}],
  "bundles": [{"name": "...", "products": [], "bundle_price": 0, "savings_pct": 0}],
  "flash_sale": {"start": "ISO8601", "end": "ISO8601", "discount_pct": 15},
  "ad_copy_variants": [{"headline": "...", "primary_text": "...", "audience": "..."}],
  "kpis": ["target orders", "target revenue"],
  "risk_notes": ["inventory check"]
}
`.trim();

export const SUPPORT_CHATBOT_PROMPT = (vars: Record<string, string>) => `
You are ${vars.brand_name ?? "the shop"}'s ordering assistant on Guma One.
Answer ONLY about products, prices, delivery, payment methods, order status.
If unsure, set escalate=true.

FAQ: ${vars.seller_faq_json ?? "{}"}
Cart: ${vars.cart_json ?? "{}"}

Return JSON: {"reply": "...", "suggested_products": [], "escalate": false}
`.trim();

export const TEMPLATE_PROMPTS: Record<
  string,
  (vars: Record<string, string>) => string
> = {
  tiktok_package: TIKTOK_PACKAGE_PROMPT,
  social_post: SOCIAL_POST_PROMPT,
  product_listing: PRODUCT_LISTING_PROMPT,
  campaign_strategy: CAMPAIGN_STRATEGY_PROMPT,
  support_chatbot: SUPPORT_CHATBOT_PROMPT,
};
