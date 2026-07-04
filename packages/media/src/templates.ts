export const ENHANCE_TEMPLATES = [
  {
    key: "white-studio",
    label: "White studio",
    description: "Clean catalog look for any product",
    preview: "linear-gradient(145deg, #ffffff 0%, #eef2f7 100%)",
  },
  {
    key: "marble-podium",
    label: "Marble podium",
    description: "Premium stone surface, skincare & gifts",
    preview: "linear-gradient(160deg, #f5f0eb 0%, #d9d2c9 55%, #ece7e1 100%)",
  },
  {
    key: "warm-bakery",
    label: "Warm bakery",
    description: "Cream tones for cakes & pastries",
    preview: "linear-gradient(145deg, #fff8ef 0%, #f3e0c8 100%)",
  },
  {
    key: "party-table",
    label: "Party table",
    description: "Soft blush for celebrations & cakes",
    preview: "linear-gradient(145deg, #fff5f7 0%, #fce7ef 100%)",
  },
  {
    key: "print-desk",
    label: "Print desk",
    description: "Neutral grey for printing & services",
    preview: "linear-gradient(145deg, #f4f4f5 0%, #e4e4e7 100%)",
  },
  {
    key: "fresh-natural",
    label: "Fresh natural",
    description: "Light green for food & organic items",
    preview: "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)",
  },
] as const;

export type EnhanceTemplateKey = (typeof ENHANCE_TEMPLATES)[number]["key"];

export const ENHANCE_TEMPLATE_KEYS = ENHANCE_TEMPLATES.map((t) => t.key);

export function isEnhanceTemplateKey(value: string): value is EnhanceTemplateKey {
  return ENHANCE_TEMPLATE_KEYS.includes(value as EnhanceTemplateKey);
}

export function getEnhanceTemplate(key: EnhanceTemplateKey) {
  return ENHANCE_TEMPLATES.find((t) => t.key === key);
}
