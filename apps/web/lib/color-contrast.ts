/** Relative luminance 0–1 (sRGB). Higher = lighter. */
export function relativeLuminance(color: string): number | null {
  const rgb = parseCssColor(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseCssColor(color: string): [number, number, number] | null {
  const raw = color.trim();
  if (!raw) return null;

  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
      ];
    }
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  const rgb = raw.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  return null;
}

/**
 * Theme colors like #eff2f5 make white CTA text invisible.
 * Swap to a solid fallback when the brand color is too light.
 */
export function solidCtaColor(
  color: string | null | undefined,
  fallback = "#0f172a"
): string {
  if (!color?.trim()) return fallback;
  const lum = relativeLuminance(color);
  if (lum === null) return color;
  // ~#c0c0c0 and lighter fail white-on-color contrast for primary buttons
  if (lum > 0.55) return fallback;
  return color;
}

export function ctaTextColor(background: string): "#ffffff" | "#0f172a" {
  const lum = relativeLuminance(background);
  if (lum === null) return "#ffffff";
  return lum > 0.55 ? "#0f172a" : "#ffffff";
}
