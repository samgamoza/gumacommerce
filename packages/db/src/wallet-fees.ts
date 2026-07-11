/** Platform fee: 2.5% of subtotal + ₱5 per paid order (see pricing page). */
export const PLATFORM_FEE_PERCENT = 2.5;
export const PLATFORM_FEE_FIXED_PHP = 5;

export function computePlatformFeeCentavos(subtotalCentavos: number): number {
  const percentFee = Math.round(subtotalCentavos * (PLATFORM_FEE_PERCENT / 100));
  const fixedFee = PLATFORM_FEE_FIXED_PHP * 100;
  return percentFee + fixedFee;
}

export function computeSellerNetCentavos(subtotalCentavos: number): number {
  return Math.max(subtotalCentavos - computePlatformFeeCentavos(subtotalCentavos), 0);
}

export function walletClearanceHours(): number {
  const raw = process.env.WALLET_CLEARANCE_HOURS;
  const parsed = raw ? Number.parseInt(raw, 10) : 48;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 48;
}

export function minAutoPayoutCentavos(): number {
  const raw = process.env.WALLET_MIN_AUTO_PAYOUT;
  const parsed = raw ? Number.parseFloat(raw) : 500;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 50000;
}
