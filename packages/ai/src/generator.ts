import type { GenerateInput, GenerateResult } from "./types";
import { MASTER_SYSTEM_PROMPT, TEMPLATE_PROMPTS } from "./templates/index";
import { resolveEffectiveModel, callLlm } from "./providers/llm";
import { MAX_TOKENS_BY_TASK, normalizePlan, resolveBudgetAwareModel } from "./plan-limits";

function extractProductHintFromPrompt(userPrompt: string): string {
  const sellerDesc = userPrompt.match(/Seller description:\s*([\s\S]+?)(?:\s*Target price|\s*$)/i);
  if (sellerDesc?.[1]) {
    return sellerDesc[1].replace(/\.\s*$/, "").trim();
  }

  const cleaned = userPrompt
    .replace(/^Shop\s+"[^"]+"\s+sells\s+[^.]*\.\s*/i, "")
    .replace(/^Write a product listing ONLY for this category\.\s*/i, "")
    .replace(/^Seller description:\s*/i, "")
    .trim();

  return cleaned.split(/[,.\n]/)[0]?.trim() || cleaned.slice(0, 80) || "New product";
}

function mockProductListing(userPrompt: string, category: string): Record<string, unknown> {
  const priceMatch = userPrompt.match(/₱?\s*(\d{2,6})/);
  const suggestedPrice = priceMatch ? Number(priceMatch[1]) : 299;
  const hint = extractProductHintFromPrompt(userPrompt);
  const title = hint.slice(0, 80);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  const cat = category.toLowerCase();
  const blurb = /food|beverage|bakery|catering/.test(cat)
    ? `made for ${cat} customers`
    : /print|signage/.test(cat)
      ? `print-ready for ${category} buyers`
      : `built for ${category} shoppers`;

  return {
    title,
    slug: slug || "new-product",
    description_html: `<p><strong>${title}</strong> — ${blurb}.</p>`,
    short_description: `${title} — order now via your Guma One shop.`,
    suggested_price: suggestedPrice,
    tags: slug.split("-").filter(Boolean).slice(0, 4),
  };
}

const MOCK_OUTPUTS: Record<string, unknown> = {
  tiktok_package: {
    hook_options: ["Grabe ang init — kailangan mo 'to! 🔥", "POV: Premium find na worth every peso"],
    caption: "Check out our latest drop 🛍️ Order now via link!",
    hashtags: ["#GumaCommerce", "#ShopLocal", "#SupportSmallBusiness"],
    order_cta: "Tap link sa bio para umorder!",
  },
  social_post: {
    primary_text: "Fresh drop alert! 🛍️\n\nOrder now — mabilis delivery, GCash/Maya/COD available.\n\nTap Order Now 👇",
    headline: "New Arrival",
    hashtags: ["#ShopLocal"],
    visual_brief: "Clean product hero shot, natural light, minimal text overlay",
  },
  product_listing: {
    title: "Featured Product",
    slug: "featured-product",
    suggested_price: 299,
    short_description: "Order now via your Guma One shop.",
  },
  campaign_strategy: {
    campaign_name: "Weekly Push",
    daily_plan: [
      { day: 1, theme: "Launch", posts: ["Product spotlight"], promo: "Free delivery min order", channel: "instagram" },
      { day: 2, theme: "Social proof", posts: ["Customer review"], promo: "None", channel: "facebook" },
    ],
  },
  support_chatbot: {
    reply: "Hi! Browse our shop and tap Checkout when ready. We accept GCash, Maya, and COD. Anong product ang gusto mo?",
    escalate: false,
  },
};

export class AiContentGenerator {
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const templateFn = TEMPLATE_PROMPTS[input.templateKey];
    if (!templateFn) {
      throw new Error(`Unknown template: ${input.templateKey}`);
    }

    const taskType =
      input.taskType ??
      (input.templateKey === "support_chatbot"
        ? "chat"
        : input.templateKey === "campaign_strategy"
          ? "agent_campaign"
          : "generation");

    const requestedModel = resolveBudgetAwareModel(
      input.subscriptionPlan,
      taskType,
      input.tokensUsedThisMonth
    );
    const model = resolveEffectiveModel(requestedModel);

    const variables = {
      ...input.variables,
      order_link: input.seller.orderLink,
      brand_name: input.seller.brandName,
      category: input.seller.category,
      location: input.seller.location,
      audience: input.seller.audience,
      tone: input.seller.tone,
    };

    const systemPrompt = MASTER_SYSTEM_PROMPT(input.seller);
    const userPrompt = `${templateFn(variables)}\n\nSeller request: ${input.userPrompt}\n\nRespond with JSON only.`;

    if (model === "mock") {
      const output =
        input.templateKey === "product_listing"
          ? mockProductListing(input.userPrompt, input.seller.category)
          : input.templateKey === "support_chatbot"
            ? MOCK_OUTPUTS.support_chatbot
            : (MOCK_OUTPUTS[input.templateKey] ?? {
                message: "Mock output — add GEMINI_API_KEY or OPENAI_API_KEY for live AI",
              });

      return {
        templateKey: input.templateKey,
        output,
        model: `mock (${normalizePlan(input.subscriptionPlan)} tier)`,
      };
    }

    const llm = await callLlm({
      model,
      system: systemPrompt,
      user: userPrompt,
      jsonMode: input.templateKey !== "support_chatbot",
      maxTokens: MAX_TOKENS_BY_TASK[taskType],
    });

    let output: unknown;
    try {
      output = JSON.parse(llm.content);
    } catch {
      if (input.templateKey === "support_chatbot") {
        output = { reply: llm.content.replace(/^```json|```$/g, "").trim(), escalate: false };
      } else {
        output = { raw: llm.content };
      }
    }

    return {
      templateKey: input.templateKey,
      output,
      model: llm.model,
      tokensUsed: llm.tokensUsed,
    };
  }
}

export function createAiGenerator(): AiContentGenerator {
  return new AiContentGenerator();
}
