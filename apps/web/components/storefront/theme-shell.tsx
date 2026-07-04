import type { CSSProperties, ReactNode } from "react";
import type { ResolvedShopTheme } from "@guma-commerce/storefront-themes";

export function themeStyle(theme: ResolvedShopTheme): CSSProperties {
  return {
    ["--shop-primary" as string]: theme.primaryColor,
    ["--shop-accent" as string]: theme.accentColor,
    ["--shop-bg" as string]: theme.background,
    ["--shop-fg" as string]: theme.foreground,
    ["--shop-card" as string]: theme.cardBackground,
    ["--shop-muted" as string]: theme.muted,
    ["--shop-border" as string]: theme.border,
    ["--shop-radius" as string]: theme.radius,
    background: theme.background,
    color: theme.foreground,
  };
}

export function StorefrontThemeShell({
  theme,
  children,
  className = "",
}: {
  theme: ResolvedShopTheme;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} style={themeStyle(theme)} data-shop-template={theme.templateId}>
      {children}
    </div>
  );
}

export function heroBackground(theme: ResolvedShopTheme, coverUrl?: string): CSSProperties {
  if (coverUrl && (theme.hero === "photo" || theme.layout === "editorial")) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.55)), url(${coverUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  switch (theme.hero) {
    case "mesh":
      return {
        background: `radial-gradient(circle at 20% 20%, ${theme.accentColor}55, transparent 45%), radial-gradient(circle at 80% 0%, ${theme.primaryColor}66, transparent 40%), ${theme.background}`,
      };
    case "chrome":
      return {
        background: `linear-gradient(135deg, ${theme.accentColor}88, ${theme.primaryColor}aa, #fde68a88)`,
      };
    case "noise":
      return {
        background: `linear-gradient(180deg, ${theme.foreground} 0%, ${theme.foreground}dd 100%)`,
      };
    case "photo":
      return {
        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
      };
    default:
      return {
        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
      };
  }
}
