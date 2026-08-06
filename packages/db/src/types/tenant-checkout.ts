/**
 * Tenant checkout configuration — draft and published share the same shape.
 * Storefront reads checkout_published_json (with settings_json fallback).
 */
export interface CheckoutCoupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  maxRedemptions?: number;
  active?: boolean;
}

export interface CheckoutTaxConfig {
  enabled?: boolean;
  /** VAT / sales tax percent, e.g. 12 for 12% */
  ratePercent?: number;
  /** When true, catalog prices already include tax */
  inclusive?: boolean;
}

export interface CheckoutAutomaticDiscount {
  type: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  label?: string;
}

export interface CheckoutPaymentAdapters {
  cod?: boolean;
  /** Direct GCash/Maya/bank (seller confirms) — MVP/beta bridge without PayMongo */
  manual_ewallet?: {
    gcash?: boolean;
    maya?: boolean;
    bank?: boolean;
  };
  paymongo?: {
    gcash?: boolean;
    paymaya?: boolean;
    qrph?: boolean;
    card?: boolean;
  };
}

export interface CheckoutCustomerRequirements {
  requireEmail?: boolean;
  /** Collect city / barangay / postal in addition to line1 */
  requireStructuredAddress?: boolean;
}

export interface TenantCheckoutJson {
  codEnabled?: boolean;
  minOrderAmount?: number;
  autoAcceptOrders?: boolean;
  tax?: CheckoutTaxConfig;
  coupons?: CheckoutCoupon[];
  automaticDiscount?: CheckoutAutomaticDiscount | null;
  paymentAdapters?: CheckoutPaymentAdapters;
  customer?: CheckoutCustomerRequirements;
  /** Minutes of inactivity before a checkout session is marked abandoned */
  abandonedAfterMinutes?: number;
  rationale?: string;
}

export const EMPTY_CHECKOUT: TenantCheckoutJson = {
  codEnabled: true,
  minOrderAmount: 99,
  autoAcceptOrders: false,
  tax: { enabled: false, ratePercent: 12, inclusive: false },
  coupons: [],
  automaticDiscount: null,
  paymentAdapters: {
    cod: true,
    // Beta default: direct e-wallet until PayMongo API is secured
    manual_ewallet: { gcash: true, maya: true, bank: false },
    paymongo: { gcash: false, paymaya: false, qrph: false, card: false },
  },
  customer: { requireEmail: false, requireStructuredAddress: false },
  abandonedAfterMinutes: 60,
};

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeCoupon(raw: unknown): CheckoutCoupon | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const code = typeof c.code === "string" ? c.code.trim().toUpperCase() : "";
  if (!code) return null;
  const type = c.type === "fixed" ? "fixed" : "percent";
  const value = asNumber(c.value, 0);
  if (value <= 0) return null;
  return {
    code,
    type,
    value,
    minSubtotal: c.minSubtotal != null ? asNumber(c.minSubtotal, 0) : undefined,
    maxRedemptions: c.maxRedemptions != null ? asNumber(c.maxRedemptions, 0) : undefined,
    active: c.active !== false,
  };
}

export function normalizeCheckoutJson(input: unknown): TenantCheckoutJson {
  if (!input || typeof input !== "object") return { ...EMPTY_CHECKOUT };
  const raw = input as Record<string, unknown>;
  const tax =
    raw.tax && typeof raw.tax === "object"
      ? (raw.tax as CheckoutTaxConfig)
      : EMPTY_CHECKOUT.tax;
  const adapters =
    raw.paymentAdapters && typeof raw.paymentAdapters === "object"
      ? (raw.paymentAdapters as CheckoutPaymentAdapters)
      : EMPTY_CHECKOUT.paymentAdapters;
  const customer =
    raw.customer && typeof raw.customer === "object"
      ? (raw.customer as CheckoutCustomerRequirements)
      : EMPTY_CHECKOUT.customer;
  const auto =
    raw.automaticDiscount && typeof raw.automaticDiscount === "object"
      ? (raw.automaticDiscount as CheckoutAutomaticDiscount)
      : null;

  const coupons = Array.isArray(raw.coupons)
    ? raw.coupons.map(normalizeCoupon).filter((c): c is CheckoutCoupon => !!c)
    : [];

  return {
    codEnabled: raw.codEnabled !== false,
    minOrderAmount: asNumber(raw.minOrderAmount, EMPTY_CHECKOUT.minOrderAmount!),
    autoAcceptOrders: raw.autoAcceptOrders === true,
    tax: {
      enabled: tax?.enabled === true,
      ratePercent: asNumber(tax?.ratePercent, 12),
      inclusive: tax?.inclusive === true,
    },
    coupons,
    automaticDiscount:
      auto && asNumber(auto.value, 0) > 0
        ? {
            type: auto.type === "fixed" ? "fixed" : "percent",
            value: asNumber(auto.value, 0),
            minSubtotal: auto.minSubtotal != null ? asNumber(auto.minSubtotal, 0) : undefined,
            label: typeof auto.label === "string" ? auto.label : undefined,
          }
        : null,
    paymentAdapters: {
      cod: adapters?.cod !== false,
      manual_ewallet: {
        gcash: adapters?.manual_ewallet?.gcash !== false,
        maya: adapters?.manual_ewallet?.maya !== false,
        bank: adapters?.manual_ewallet?.bank === true,
      },
      paymongo: {
        gcash: adapters?.paymongo?.gcash === true,
        paymaya: adapters?.paymongo?.paymaya === true,
        qrph: adapters?.paymongo?.qrph === true,
        card: adapters?.paymongo?.card === true,
      },
    },
    customer: {
      requireEmail: customer?.requireEmail === true,
      requireStructuredAddress: customer?.requireStructuredAddress === true,
    },
    abandonedAfterMinutes: Math.max(
      15,
      asNumber(raw.abandonedAfterMinutes, EMPTY_CHECKOUT.abandonedAfterMinutes!)
    ),
    rationale: typeof raw.rationale === "string" ? raw.rationale : undefined,
  };
}

/** Seed checkout config from legacy settings_json fields. */
export function checkoutFromLegacySettings(settings: {
  codEnabled?: boolean;
  minOrderAmount?: number;
  autoAcceptOrders?: boolean;
} | null | undefined): TenantCheckoutJson {
  return normalizeCheckoutJson({
    ...EMPTY_CHECKOUT,
    codEnabled: settings?.codEnabled ?? true,
    minOrderAmount: settings?.minOrderAmount ?? 99,
    autoAcceptOrders: settings?.autoAcceptOrders ?? false,
  });
}

export function findActiveCoupon(
  checkout: TenantCheckoutJson,
  code: string | null | undefined
): CheckoutCoupon | null {
  if (!code?.trim()) return null;
  const normalized = code.trim().toUpperCase();
  return (
    checkout.coupons?.find((c) => c.active !== false && c.code === normalized) ?? null
  );
}

export interface CheckoutTotalsInput {
  subtotal: number;
  deliveryFee: number;
  checkout: TenantCheckoutJson;
  couponCode?: string | null;
}

export interface CheckoutTotals {
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  couponCode: string | null;
  discountLabel: string | null;
}

/** Pure totals math used by createOrder and storefront preview. */
export function computeCheckoutTotals(input: CheckoutTotalsInput): CheckoutTotals {
  const subtotal = Math.max(0, input.subtotal);
  let discount = 0;
  let discountLabel: string | null = null;
  let couponCode: string | null = null;

  const coupon = findActiveCoupon(input.checkout, input.couponCode);
  if (coupon) {
    const min = coupon.minSubtotal ?? 0;
    if (subtotal >= min) {
      discount =
        coupon.type === "percent"
          ? (subtotal * coupon.value) / 100
          : coupon.value;
      discountLabel = `Coupon ${coupon.code}`;
      couponCode = coupon.code;
    }
  } else if (input.checkout.automaticDiscount) {
    const auto = input.checkout.automaticDiscount;
    const min = auto.minSubtotal ?? 0;
    if (subtotal >= min) {
      discount =
        auto.type === "percent" ? (subtotal * auto.value) / 100 : auto.value;
      discountLabel = auto.label ?? "Automatic discount";
    }
  }

  discount = Math.min(discount, subtotal);
  const afterDiscount = subtotal - discount;

  const taxCfg = input.checkout.tax;
  let tax = 0;
  if (taxCfg?.enabled && (taxCfg.ratePercent ?? 0) > 0) {
    const rate = (taxCfg.ratePercent ?? 0) / 100;
    if (taxCfg.inclusive) {
      tax = afterDiscount - afterDiscount / (1 + rate);
    } else {
      tax = afterDiscount * rate;
    }
  }

  const deliveryFee = Math.max(0, input.deliveryFee);
  const taxableBase = taxCfg?.inclusive ? afterDiscount : afterDiscount + tax;
  const total = Math.max(0, taxableBase + deliveryFee);

  return {
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discount),
    tax: roundMoney(tax),
    deliveryFee: roundMoney(deliveryFee),
    total: roundMoney(total),
    couponCode,
    discountLabel,
  };
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isPaymentMethodEnabled(
  checkout: TenantCheckoutJson,
  method: string
): boolean {
  if (method === "cod") {
    return checkout.paymentAdapters?.cod !== false && checkout.codEnabled !== false;
  }

  const manual = checkout.paymentAdapters?.manual_ewallet;
  const pm = checkout.paymentAdapters?.paymongo;

  if (method === "gcash") {
    return manual?.gcash !== false || pm?.gcash === true;
  }
  if (method === "paymaya") {
    return manual?.maya !== false || pm?.paymaya === true;
  }
  if (method === "bank") {
    return manual?.bank === true;
  }
  if (method === "qrph") return pm?.qrph === true;
  if (method === "card") return pm?.card === true;
  return false;
}
