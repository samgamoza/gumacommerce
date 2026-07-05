import { getShopTemplate, isShopTemplateId, normalizeShopTemplateId } from "./templates";
import type { ResolvedShopTheme, TenantThemeJson } from "./types";

const DEFAULT_TEMPLATE_ID = "clean-guma";

export function resolveShopTheme(
  themeJson: TenantThemeJson | null | undefined,
  shopName: string
): ResolvedShopTheme {
  const storedId = themeJson?.templateId
    ? normalizeShopTemplateId(themeJson.templateId)
    : undefined;
  const templateId =
    storedId && isShopTemplateId(storedId) ? storedId : DEFAULT_TEMPLATE_ID;

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
    displayFont: themeJson?.displayFont ?? template.tokens.displayFont,
    previewGradient: template.previewGradient,
  };
}

export function canUseTemplate(
  templateId: string,
  subscriptionPlan: string | null | undefined
): boolean {
  const normalized = normalizeShopTemplateId(templateId);
  if (!isShopTemplateId(normalized)) return false;
  const template = getShopTemplate(normalized);
  const plan = subscriptionPlan ?? "free";

  if (template.minPlan === "free") return true;
  if (template.minPlan === "growth") return plan === "growth" || plan === "pro";
  return plan === "pro";
}
