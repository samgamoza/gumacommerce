/**
 * Category-aware AI product creator prompts.
 * Chips/placeholders must match Store DNA — never default to bakery copy for print shops.
 */

export interface ProductAiPromptPack {
  placeholder: string;
  examples: string[];
  priceHintPlaceholder: string;
}

const DEFAULT_PACK: ProductAiPromptPack = {
  placeholder: "e.g. Best-seller item, size/specs, who it's for, around ₱499",
  examples: [
    "Best-seller bundle, ready to ship, around ₱499",
    "Custom order — tell us size and deadline",
    "Starter pack for first-time buyers, ₱299",
    "Premium option with free pickup in Metro Manila",
  ],
  priceHintPlaceholder: "499",
};

const BY_CATEGORY: Record<string, ProductAiPromptPack> = {
  "Printing & Signage": {
    placeholder:
      "e.g. Custom tarpaulin 2×3 ft, full color, with eyelets, 3-day turnaround, ₱350",
    examples: [
      "Custom tarpaulin printing 2×3 ft, 3-day turnaround, ₱350",
      "Business cards 500pcs matte, double-sided, ₱899",
      "Acrylic signage 12×18 in with stand, rush 24h",
      "Sticker die-cut 100pcs logo labels, waterproof, ₱450",
    ],
    priceHintPlaceholder: "350",
  },
  "Auto Shop & Services": {
    placeholder: "e.g. Ceramic coating package sedan, 1-day service, ₱2,500",
    examples: [
      "Full car wash & vacuum sedan, same-day, ₱450",
      "Ceramic coating package, 1-year warranty, ₱4,999",
      "Engine oil change synthetic 5W-30, labor included",
      "Interior detailing deep clean, SUV, ₱1,200",
    ],
    priceHintPlaceholder: "450",
  },
  "Automotive Parts & Accessories": {
    placeholder: "e.g. LED headlight kit H4, plug-and-play, ₱1,299",
    examples: [
      "LED headlight kit H4 plug-and-play, ₱1,299",
      "Floor mats 3D custom-fit sedan, set of 4",
      "Dashcam front+rear 1080p with parking mode",
      "Air filter OEM-compatible for Vios 2020+",
    ],
    priceHintPlaceholder: "1299",
  },
  "Car Wash & Detailing": {
    placeholder: "e.g. Premium foam wash + wax sedan, 45 mins, ₱399",
    examples: [
      "Premium foam wash + wax sedan, ₱399",
      "Paint correction 1-step polish, small car",
      "Underchassis wash + engine bay detail",
      "Monthly detailing membership 4 washes",
    ],
    priceHintPlaceholder: "399",
  },
  "Food & Beverage": {
    placeholder: "e.g. Mango bravo cake, good for birthdays, serves 8–10, ₱399",
    examples: [
      "Mango bravo cake, party size, around ₱399",
      "Ube cheese pandesal dozen, fresh daily, ₱180",
      "Iced Spanish latte 16oz, perfect for summer",
      "Silog breakfast meal with drink, ₱149",
    ],
    priceHintPlaceholder: "399",
  },
  Catering: {
    placeholder: "e.g. Packed lunch set for 20 pax, delivery Metro Manila, ₱4,500",
    examples: [
      "Packed lunch set 20 pax, ₱4,500",
      "Birthday catering package 50 pax buffet",
      "Office baon weekly plan Mon–Fri",
      "Lechon kawali tray good for 10–12",
    ],
    priceHintPlaceholder: "4500",
  },
  "Fashion & Apparel": {
    placeholder: "e.g. Oversized linen shirt unisex M–XL, soft wash, ₱890",
    examples: [
      "Oversized linen shirt unisex M–XL, ₱890",
      "Cropped denim jacket vintage wash",
      "Everyday tote bag canvas embroidered logo",
      "Ribbed tank 3-pack neutrals, free size",
    ],
    priceHintPlaceholder: "890",
  },
  "Beauty & Skincare": {
    placeholder: "e.g. Niacinamide serum 30ml, for oily skin, ₱349",
    examples: [
      "Niacinamide serum 30ml oily skin, ₱349",
      "SPF50 sunscreen gel lightweight, ₱299",
      "Lip oil tint set of 3 shades",
      "Facial cleansing balm 100ml unscented",
    ],
    priceHintPlaceholder: "349",
  },
  "Beauty Salons & Spas": {
    placeholder: "e.g. Rebonding package short hair, includes treatment, ₱1,999",
    examples: [
      "Rebonding package short hair, ₱1,999",
      "Gel manicure + nail art, walk-in",
      "Facial deep cleansing 60 mins",
      "Hair color highlight package",
    ],
    priceHintPlaceholder: "1999",
  },
  "Barber & Hair Salons": {
    placeholder: "e.g. Classic fade + wash, 30 mins, ₱250",
    examples: [
      "Classic fade + wash, ₱250",
      "Beard trim and hot towel finish",
      "Kids haircut under 12",
      "Hair color for men package",
    ],
    priceHintPlaceholder: "250",
  },
  Electronics: {
    placeholder: "e.g. Wireless earbuds ANC, Type-C case, ₱1,499",
    examples: [
      "Wireless earbuds ANC, Type-C, ₱1,499",
      "20W GaN charger dual port",
      "Tempered glass iPhone 15 Pro Max",
      "Power bank 20000mAh PD fast charge",
    ],
    priceHintPlaceholder: "1499",
  },
  "Furniture & Home": {
    placeholder: "e.g. Oak side table 40cm, assemble-free, Metro Manila delivery",
    examples: [
      "Oak side table 40cm, ₱1,899",
      "Linen curtain set 2 panels blackout",
      "Storage ottoman foldable beige",
      "Desk lamp LED dimmable USB-C",
    ],
    priceHintPlaceholder: "1899",
  },
  "Pet Supplies & Lovers": {
    placeholder: "e.g. Grain-free dog food 1kg adult, chicken, ₱420",
    examples: [
      "Grain-free dog food 1kg chicken, ₱420",
      "Cat litter clumping 10L unscented",
      "Adjustable harness medium dogs",
      "Dental chew sticks 7-pack",
    ],
    priceHintPlaceholder: "420",
  },
  "Retail & General Merchandise": {
    placeholder: "e.g. Everyday tote + pouch set, ready stock, ₱299",
    examples: [
      "Everyday tote + pouch set, ₱299",
      "Reusable tumbler 500ml with straw",
      "Gift wrap bundle ribbon + cards",
      "Home organization kit 5 pcs",
    ],
    priceHintPlaceholder: "299",
  },
  "Professional & Consulting": {
    placeholder: "e.g. 1-hour strategy call, Zoom, includes notes PDF, ₱1,500",
    examples: [
      "1-hour strategy call Zoom, ₱1,500",
      "Brand kit starter logo + colors",
      "Social media setup package 5 posts",
      "Business registration coaching session",
    ],
    priceHintPlaceholder: "1500",
  },
  "Handmade & Crafts": {
    placeholder: "e.g. Handwoven pouch natural dye, one-of-a-kind, ₱650",
    examples: [
      "Handwoven pouch natural dye, ₱650",
      "Resin coaster set of 4 custom name",
      "Crochet keychain mini plants",
      "Beaded bracelet adjustable",
    ],
    priceHintPlaceholder: "650",
  },
  "Grocery & Supermarket": {
    placeholder: "e.g. Weekly veggies pack family size, farm-fresh, ₱399",
    examples: [
      "Weekly veggies pack family, ₱399",
      "Rice 25kg well-milled",
      "Frozen siomai pack 50pcs",
      "Cooking oil 1L promo",
    ],
    priceHintPlaceholder: "399",
  },
  "Organic & Farm Produce": {
    placeholder: "e.g. Organic eggs tray of 12, free-range, ₱220",
    examples: [
      "Organic eggs tray of 12, ₱220",
      "Hydroponic lettuce pack",
      "Seasonal fruit box mixed 3kg",
      "Herb starter kit basil + mint",
    ],
    priceHintPlaceholder: "220",
  },
};

const KEYWORD_ROUTES: Array<{ test: RegExp; key: keyof typeof BY_CATEGORY }> = [
  { test: /print|signage|tarpaulin|banner|sticker|graphic/i, key: "Printing & Signage" },
  { test: /auto shop|car repair|garage|motor/i, key: "Auto Shop & Services" },
  { test: /car wash|detail/i, key: "Car Wash & Detailing" },
  { test: /automotive|parts|accessories/i, key: "Automotive Parts & Accessories" },
  { test: /food|beverage|restaurant|cafe|bakery/i, key: "Food & Beverage" },
  { test: /fashion|apparel|clothing/i, key: "Fashion & Apparel" },
  { test: /electron|gadget|phone/i, key: "Electronics" },
  { test: /beauty|skincare/i, key: "Beauty & Skincare" },
  { test: /salon|spa/i, key: "Beauty Salons & Spas" },
  { test: /barber|hair/i, key: "Barber & Hair Salons" },
  { test: /pet/i, key: "Pet Supplies & Lovers" },
  { test: /furniture|home/i, key: "Furniture & Home" },
  { test: /grocery|supermarket/i, key: "Grocery & Supermarket" },
  { test: /organic|farm/i, key: "Organic & Farm Produce" },
  { test: /consult|professional|agency/i, key: "Professional & Consulting" },
  { test: /handmade|craft/i, key: "Handmade & Crafts" },
  { test: /retail|merchandise/i, key: "Retail & General Merchandise" },
];

export function productAiPromptPack(
  category: string | null | undefined,
  shopName?: string | null
): ProductAiPromptPack {
  const cat = category?.trim() || "";
  if (cat && BY_CATEGORY[cat]) return BY_CATEGORY[cat]!;

  for (const route of KEYWORD_ROUTES) {
    if (route.test.test(cat) || (shopName && route.test.test(shopName))) {
      return BY_CATEGORY[route.key]!;
    }
  }

  // PRINTAIR-style names without category set yet
  if (shopName && /print|air|sign/i.test(shopName)) {
    return BY_CATEGORY["Printing & Signage"]!;
  }

  return DEFAULT_PACK;
}
