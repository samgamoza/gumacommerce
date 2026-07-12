export function formatWaggyPrice(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function waggyStarRating(productId: string): string {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash + productId.charCodeAt(i) * (i + 1)) % 100;
  }
  return (4 + (hash % 10) / 10).toFixed(1);
}

export function waggyDiscount(price: number, compareAt?: number): string | null {
  if (!compareAt || compareAt <= price) return null;
  const pct = Math.round(((compareAt - price) / compareAt) * 100);
  return `-${pct}%`;
}
