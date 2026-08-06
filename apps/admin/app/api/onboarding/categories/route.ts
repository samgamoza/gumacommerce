import { NextResponse } from "next/server";
import { listOnboardingCategoryLabels } from "@guma-commerce/db";
import {
  SHOP_BUSINESS_CATEGORIES,
  SHOP_CATEGORY_GUIDE,
  popularCategoryLabels,
} from "@guma-commerce/storefront-themes";

/** Public list of business categories for seller signup / Launch DNA. */
export async function GET() {
  try {
    const categories = await listOnboardingCategoryLabels(SHOP_BUSINESS_CATEGORIES);
    return NextResponse.json({
      ok: true,
      categories,
      popular: popularCategoryLabels(categories),
      guideCount: SHOP_CATEGORY_GUIDE.length,
      source: "template-intelligence",
    });
  } catch (error) {
    console.error("[onboarding/categories]", error);
    // Fail open — code allowlist so signup never blocks on DB
    return NextResponse.json({
      ok: true,
      categories: [...SHOP_BUSINESS_CATEGORIES],
      popular: popularCategoryLabels(SHOP_BUSINESS_CATEGORIES),
      guideCount: SHOP_CATEGORY_GUIDE.length,
      source: "fallback",
    });
  }
}
