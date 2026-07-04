import { NextResponse } from "next/server";
import { z } from "zod";
import { createAiGenerator, type TemplateKey } from "@guma-commerce/ai";

const generateSchema = z.object({
  templateKey: z.enum([
    "tiktok_package",
    "social_post",
    "product_listing",
    "campaign_strategy",
    "support_chatbot",
  ]),
  userPrompt: z.string().min(3),
  seller: z.object({
    brandName: z.string(),
    category: z.string(),
    location: z.string(),
    tone: z.enum(["friendly_taglish", "professional_en", "gen_z_taglish"]).default("friendly_taglish"),
    audience: z.string().default("Filipino mobile shoppers"),
    orderLink: z.string().url(),
  }),
  variables: z.record(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = generateSchema.parse(await request.json());
    const generator = createAiGenerator();

    const result = await generator.generate({
      templateKey: body.templateKey as TemplateKey,
      userPrompt: body.userPrompt,
      seller: body.seller,
      variables: body.variables,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 400 });
  }
}
