export function formatOrganicPrice(cents: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function organicStarRating(productId: string): string {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash + productId.charCodeAt(i) * (i + 1)) % 100;
  }
  return (4 + (hash % 10) / 10).toFixed(1);
}
