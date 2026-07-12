/** Canonical business categories for shop signup and tenant metadata. */

export const SHOP_BUSINESS_CATEGORIES = [

  "Food & Beverage",

  "Catering",

  "Retail & General Merchandise",

  "Wholesale & B2B",

  "Fashion & Apparel",

  "Shoes & Footwear",

  "Beauty & Skincare",

  "Beauty Salons & Spas",

  "Barber & Hair Salons",

  "Auto Shop & Services",

  "Printing & Signage",

  "Camping & Adventures",

  "Handmade & Crafts",

  "Furniture & Home",

  "Electronics",

  "Grocery & Supermarket",

  "Hotels & Resorts",

  "Travel & Tours",

  "Organic & Farm Produce",

  "Pet Supplies & Lovers",

  "Healthcare & Clinics",

  "HVAC & Air Conditioning",

  "Construction & Renovation",

  "Home Services & Trades",

  "Real Estate & Property",

  "Education & Training",

  "Childcare & Education",

  "Fitness & Wellness",

  "Photography & Creative",

  "Logistics & Shipping",

  "Professional & Consulting",

  "Landscaping & Gardening",

  "Solar & Renewable Energy",

  "Security & Surveillance",

  "Cleaning & Janitorial",

  "Events & Entertainment",

  "Industrial & Manufacturing",

  "Insurance & Financial Services",

  "Attractions & Leisure",

  "General",

] as const;



export type ShopBusinessCategory = (typeof SHOP_BUSINESS_CATEGORIES)[number];



export const DEFAULT_SHOP_BUSINESS_CATEGORY: ShopBusinessCategory = "Food & Beverage";



export const SHOP_CATEGORY_EMOJI: Record<ShopBusinessCategory, string> = {

  "Food & Beverage": "🍽️",

  Catering: "🍱",

  "Retail & General Merchandise": "🏪",

  "Wholesale & B2B": "📦",

  "Fashion & Apparel": "👗",

  "Shoes & Footwear": "👟",

  "Beauty & Skincare": "💄",

  "Beauty Salons & Spas": "💇",

  "Barber & Hair Salons": "💈",

  "Auto Shop & Services": "🔧",

  "Printing & Signage": "🖨️",

  "Camping & Adventures": "⛺",

  "Handmade & Crafts": "🎨",

  "Furniture & Home": "🛋️",

  "Electronics": "📱",

  "Grocery & Supermarket": "🛒",

  "Hotels & Resorts": "🏨",

  "Travel & Tours": "✈️",

  "Organic & Farm Produce": "🌿",

  "Pet Supplies & Lovers": "🐾",

  "Healthcare & Clinics": "🏥",

  "HVAC & Air Conditioning": "❄️",

  "Construction & Renovation": "🏗️",

  "Home Services & Trades": "🔨",

  "Real Estate & Property": "🏠",

  "Education & Training": "📚",

  "Childcare & Education": "👶",

  "Fitness & Wellness": "💪",

  "Photography & Creative": "📷",

  "Logistics & Shipping": "🚚",

  "Professional & Consulting": "💼",

  "Landscaping & Gardening": "🌱",

  "Solar & Renewable Energy": "☀️",

  "Security & Surveillance": "🔒",

  "Cleaning & Janitorial": "🧹",

  "Events & Entertainment": "🎉",

  "Industrial & Manufacturing": "🏭",

  "Insurance & Financial Services": "🛡️",

  "Attractions & Leisure": "🎡",

  General: "🛍️",

};



/** Emoji for any stored category string (includes legacy labels). */

export function emojiForShopCategory(category: string | null | undefined): string {

  const key = category?.trim();

  if (!key) return SHOP_CATEGORY_EMOJI.General;

  return (

    SHOP_CATEGORY_EMOJI[key as ShopBusinessCategory] ??

    (key.includes("Fashion") ? "👗" : undefined) ??

    (key.includes("Shoes") || key.includes("Footwear") ? "👟" : undefined) ??

    (key.includes("Beauty") ? "💄" : undefined) ??

    (key.includes("Barber") || key.includes("Hair") ? "💈" : undefined) ??

    (key.includes("Furniture") || key.includes("Home") ? "🛋️" : undefined) ??

    (key.includes("Grocery") || key.includes("Supermarket") ? "🛒" : undefined) ??

    (key.includes("Hotel") || key.includes("Resort") ? "🏨" : undefined) ??

    (key.includes("Travel") || key.includes("Tour") ? "✈️" : undefined) ??

    (key.includes("Organic") || key.includes("Farm") ? "🌿" : undefined) ??

    (key.includes("Pet") ? "🐾" : undefined) ??

    (key.includes("Clinic") || key.includes("Dental") || key.includes("Health") ? "🏥" : undefined) ??

    (key.includes("HVAC") || (key.includes("Air") && key.includes("Con")) ? "❄️" : undefined) ??

    (key.includes("Construction") || key.includes("Renovation") ? "🏗️" : undefined) ??

    (key.includes("Real Estate") || key.includes("Property") ? "🏠" : undefined) ??

    (key.includes("Education") || key.includes("School") ? "📚" : undefined) ??

    (key.includes("Fitness") || key.includes("Gym") ? "💪" : undefined) ??

    (key.includes("Photo") ? "📷" : undefined) ??

    (key.includes("Logistics") || key.includes("Shipping") ? "🚚" : undefined) ??

    (key.includes("Solar") || key.includes("Energy") ? "☀️" : undefined) ??

    (key.includes("Cleaning") ? "🧹" : undefined) ??

    (key.includes("Event") || key.includes("Entertainment") ? "🎉" : undefined) ??

    SHOP_CATEGORY_EMOJI.General

  );

}

