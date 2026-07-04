import { getShopTemplate, isShopTemplateId } from "./templates";
import type { ResolvedShopTheme, TenantThemeJson } from "./types";

const DEFAULT_TEMPLATE_ID = "clean-sari";

export function resolveShopTheme(
  themeJson: TenantThemeJson | null | undefined,
  shopName: string
): ResolvedShopTheme {
  const templateId =
    themeJson?.templateId && isShopTemplateId(themeJson.templateId)
      ? themeJson.templateId
      : DEFAULT_TEMPLATE_ID;

  const template = getShopTemplate(templateId);

  return {
    templateId: template.id,
    tier: template.tier,
    label: template.label,
    layout: template.layout,
    header: template.header,
    card: template.card,
    hero: template.hero,
    tagline: themeJson?.tagline?.trim() || `Welcome to ${shopName}`,
    promoTitle: themeJson?.promoTitle?.trim() || "Free delivery on orders ₱500+",
    promoSubtitle: themeJson?.promoSubtitle?.trim() || "Metro Manila · Until 9 PM",
    primaryColor: themeJson?.primaryColor ?? template.tokens.primary,
    accentColor: themeJson?.accentColor ?? template.tokens.accent,
    background: template.tokens.background,
    foreground: template.tokens.foreground,
    cardBackground: template.tokens.card,
    muted: template.tokens.muted,
    border: template.tokens.border,
    mode: template.tokens.mode,
    radius: template.tokens.radius,
    displayFont: template.tokens.displayFont,
    previewGradient: template.previewGradient,
  };
}

export function canUseTemplate(
  templateId: string,
  subscriptionPlan: string | null | undefined
): boolean {
  if (!isShopTemplateId(templateId)) return false;
  const template = getShopTemplate(templateId);
  const plan = subscriptionPlan ?? "free";

  if (template.minPlan === "free") return true;
  if (template.minPlan === "growth") return plan === "growth" || plan === "pro";
  return plan === "pro";
}
