import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "../client";
import {
  kycVerificationSessions,
  orders,
  tenantPayouts,
  tenantWallets,
  tenants,
  walletLedgerEntries,
} from "../schema/index";
import {
  computePlatformFeeCentavos,
  computeSellerNetCentavos,
  minAutoPayoutCentavos,
  walletClearanceHours,
} from "../wallet-fees";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function toCentavos(value: string | number): number {
  return Math.round(Number(value) * 100);
}

function fromCentavos(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

function subCentavos(a: string, bCentavos: number): string {
  return fromCentavos(Math.max(toCentavos(a) - bCentavos, 0));
}

async function ensureTenantWallet(db: Db | Tx, tenantId: string) {
  const [existing] = await db
    .select()
    .from(tenantWallets)
    .where(eq(tenantWallets.tenantId, tenantId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(tenantWallets)
    .values({ tenantId })
    .returning();
  return created!;
}

export interface TenantWalletSummary {
  availableBalance: string;
  pendingBalance: string;
  totalWithdrawn: string;
}

export interface WalletLedgerItem {
  id: string;
  type: string;
  status: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  description: string | null;
  orderId: string | null;
  availableAt: Date | null;
  createdAt: Date;
}

export interface TenantPayoutItem {
  id: string;
  amount: string;
  fee: string;
  method: string;
  destinationAccount: string;
  destinationName: string;
  status: string;
  autoTriggered: boolean;
  processedAt: Date | null;
  createdAt: Date;
}

export interface TenantWalletSettings {
  autoPayoutEnabled?: boolean;
  payoutMethod?: "gcash" | "maya" | "bank";
  payoutAccount?: string;
  payoutAccountName?: string;
  kycVerified?: boolean;
}

export function resolveWalletSettings(settingsJson: Record<string, unknown>): TenantWalletSettings {
  const wallet = settingsJson.wallet;
  if (!wallet || typeof wallet !== "object") return {};
  const w = wallet as Record<string, unknown>;
  return {
    autoPayoutEnabled: w.autoPayoutEnabled === true,
    payoutMethod:
      w.payoutMethod === "gcash" || w.payoutMethod === "maya" || w.payoutMethod === "bank"
        ? w.payoutMethod
        : undefined,
    payoutAccount: typeof w.payoutAccount === "string" ? w.payoutAccount : undefined,
    payoutAccountName:
      typeof w.payoutAccountName === "string" ? w.payoutAccountName : undefined,
    kycVerified: w.kycVerified === true,
  };
}

/** Credit seller earnings when an order is paid (online) or COD is collected. Idempotent. */
export async function creditSaleForOrder(
  orderId: string,
  options?: { immediateAvailable?: boolean }
): Promise<{ credited: boolean; netAmount?: string }> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return { credited: false };
    if (order.paymentStatus !== "paid") return { credited: false };
    if (order.status === "refunded" || order.status === "cancelled") return { credited: false };

    const [existing] = await tx
      .select({ id: walletLedgerEntries.id })
      .from(walletLedgerEntries)
      .where(
        and(
          eq(walletLedgerEntries.orderId, orderId),
          eq(walletLedgerEntries.type, "sale_credit")
        )
      )
      .limit(1);
    if (existing) return { credited: false };

    const subtotalCentavos = toCentavos(order.subtotal);
    const feeCentavos = computePlatformFeeCentavos(subtotalCentavos);
    const netCentavos = computeSellerNetCentavos(subtotalCentavos);
    if (netCentavos <= 0) return { credited: false };

    const immediate = options?.immediateAvailable === true;
    const paidAt = order.paidAt ?? new Date();
    const clearanceMs = walletClearanceHours() * 60 * 60 * 1000;
    const availableAt = immediate ? paidAt : new Date(paidAt.getTime() + clearanceMs);
    const status = immediate ? "available" : "pending";

    await ensureTenantWallet(tx, order.tenantId);

    await tx.insert(walletLedgerEntries).values({
      tenantId: order.tenantId,
      orderId: order.id,
      type: "sale_credit",
      status,
      grossAmount: order.subtotal,
      feeAmount: fromCentavos(feeCentavos),
      netAmount: fromCentavos(netCentavos),
      description: `Order ${order.orderNumber} · sale credit`,
      availableAt,
    });

    if (immediate) {
      await tx
        .update(tenantWallets)
        .set({
          availableBalance: sql`${tenantWallets.availableBalance} + ${fromCentavos(netCentavos)}`,
          updatedAt: new Date(),
        })
        .where(eq(tenantWallets.tenantId, order.tenantId));
    } else {
      await tx
        .update(tenantWallets)
        .set({
          pendingBalance: sql`${tenantWallets.pendingBalance} + ${fromCentavos(netCentavos)}`,
          updatedAt: new Date(),
        })
        .where(eq(tenantWallets.tenantId, order.tenantId));
    }

    // Record platform fee on the order for reporting.
    await tx
      .update(orders)
      .set({ serviceFee: fromCentavos(feeCentavos) })
      .where(eq(orders.id, order.id));

    return { credited: true, netAmount: fromCentavos(netCentavos) };
  });
}

/** Move a pending sale credit to available (e.g. order delivered or clearance elapsed). */
export async function releaseOrderSaleCredit(orderId: string): Promise<boolean> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [entry] = await tx
      .select()
      .from(walletLedgerEntries)
      .where(
        and(
          eq(walletLedgerEntries.orderId, orderId),
          eq(walletLedgerEntries.type, "sale_credit"),
          eq(walletLedgerEntries.status, "pending")
        )
      )
      .limit(1);
    if (!entry) return false;

    const netCentavos = toCentavos(entry.netAmount);
    await tx
      .update(walletLedgerEntries)
      .set({ status: "available" })
      .where(eq(walletLedgerEntries.id, entry.id));

    await tx
      .update(tenantWallets)
      .set({
        pendingBalance: sql`greatest(${tenantWallets.pendingBalance} - ${entry.netAmount}, 0)`,
        availableBalance: sql`${tenantWallets.availableBalance} + ${entry.netAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(tenantWallets.tenantId, entry.tenantId));

    return true;
  });
}

/** Cron: release pending credits whose clearance window has passed. */
export async function releaseExpiredPendingCredits(): Promise<number> {
  const db = getDb();
  const now = new Date();
  const pending = await db
    .select({ orderId: walletLedgerEntries.orderId })
    .from(walletLedgerEntries)
    .where(
      and(
        eq(walletLedgerEntries.type, "sale_credit"),
        eq(walletLedgerEntries.status, "pending"),
        lte(walletLedgerEntries.availableAt, now)
      )
    );

  let released = 0;
  for (const row of pending) {
    if (!row.orderId) continue;
    const ok = await releaseOrderSaleCredit(row.orderId);
    if (ok) released += 1;
  }
  return released;
}

/** Reverse a sale credit when an order is refunded. */
export async function reverseSaleCreditForOrder(orderId: string): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    const [entry] = await tx
      .select()
      .from(walletLedgerEntries)
      .where(
        and(
          eq(walletLedgerEntries.orderId, orderId),
          eq(walletLedgerEntries.type, "sale_credit"),
          inArray(walletLedgerEntries.status, ["pending", "available"])
        )
      )
      .limit(1);
    if (!entry) return;

    const netCentavos = toCentavos(entry.netAmount);
    await tx
      .update(walletLedgerEntries)
      .set({ status: "cancelled" })
      .where(eq(walletLedgerEntries.id, entry.id));

    await tx.insert(walletLedgerEntries).values({
      tenantId: entry.tenantId,
      orderId: entry.orderId,
      type: "refund_debit",
      status: "completed",
      grossAmount: entry.grossAmount,
      feeAmount: "0.00",
      netAmount: fromCentavos(-netCentavos),
      description: `Refund reversal for order credit`,
    });

    const wallet = await ensureTenantWallet(tx, entry.tenantId);
    if (entry.status === "pending") {
      await tx
        .update(tenantWallets)
        .set({
          pendingBalance: subCentavos(wallet.pendingBalance, netCentavos),
          updatedAt: new Date(),
        })
        .where(eq(tenantWallets.tenantId, entry.tenantId));
    } else {
      await tx
        .update(tenantWallets)
        .set({
          availableBalance: subCentavos(wallet.availableBalance, netCentavos),
          updatedAt: new Date(),
        })
        .where(eq(tenantWallets.tenantId, entry.tenantId));
    }
  });
}

export async function getWalletSummary(tenantId: string): Promise<TenantWalletSummary> {
  const db = getDb();
  const wallet = await ensureTenantWallet(db, tenantId);
  return {
    availableBalance: wallet.availableBalance,
    pendingBalance: wallet.pendingBalance,
    totalWithdrawn: wallet.totalWithdrawn,
  };
}

export async function listWalletLedger(
  tenantId: string,
  limit = 30
): Promise<WalletLedgerItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(walletLedgerEntries)
    .where(eq(walletLedgerEntries.tenantId, tenantId))
    .orderBy(desc(walletLedgerEntries.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    grossAmount: row.grossAmount,
    feeAmount: row.feeAmount,
    netAmount: row.netAmount,
    description: row.description,
    orderId: row.orderId,
    availableAt: row.availableAt,
    createdAt: row.createdAt,
  }));
}

export async function listTenantPayouts(
  tenantId: string,
  limit = 20
): Promise<TenantPayoutItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(tenantPayouts)
    .where(eq(tenantPayouts.tenantId, tenantId))
    .orderBy(desc(tenantPayouts.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    fee: row.fee,
    method: row.method,
    destinationAccount: row.destinationAccount,
    destinationName: row.destinationName,
    status: row.status,
    autoTriggered: row.autoTriggered,
    processedAt: row.processedAt,
    createdAt: row.createdAt,
  }));
}

export class WalletError extends Error {
  constructor(
    message: string,
    public code:
      | "INSUFFICIENT_BALANCE"
      | "KYC_REQUIRED"
      | "PAYOUT_DESTINATION_REQUIRED"
      | "INVALID_AMOUNT"
      | "PAYOUTS_DISABLED"
  ) {
    super(message);
    this.name = "WalletError";
  }
}

/**
 * Payouts move real money. Until a disbursement provider is wired into
 * processQueuedPayouts, they stay off unless WALLET_PAYOUTS_ENABLED=true.
 */
export function walletPayoutsEnabled(): boolean {
  return process.env.WALLET_PAYOUTS_ENABLED?.trim().toLowerCase() === "true";
}

/** KYC truth is the latest session row (only platform review approves it). */
async function latestKycApproved(db: Db | Tx, tenantId: string): Promise<boolean> {
  const [latest] = await db
    .select({ status: kycVerificationSessions.status })
    .from(kycVerificationSessions)
    .where(eq(kycVerificationSessions.tenantId, tenantId))
    .orderBy(desc(kycVerificationSessions.createdAt))
    .limit(1);
  return latest?.status === "approved";
}

export async function requestTenantPayout(params: {
  tenantId: string;
  amountCentavos: number;
  method: "gcash" | "maya" | "bank";
  destinationAccount: string;
  destinationName: string;
  autoTriggered?: boolean;
}): Promise<{ payoutId: string }> {
  if (!walletPayoutsEnabled()) {
    throw new WalletError(
      "Payouts are not available yet — your balance stays safe in your wallet.",
      "PAYOUTS_DISABLED"
    );
  }
  if (!Number.isInteger(params.amountCentavos) || params.amountCentavos < 10000) {
    throw new WalletError("Minimum payout is ₱100.", "INVALID_AMOUNT");
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const [tenant] = await tx
      .select({ settingsJson: tenants.settingsJson })
      .from(tenants)
      .where(eq(tenants.id, params.tenantId))
      .limit(1);
    if (!tenant) throw new WalletError("Shop not found.", "INVALID_AMOUNT");

    if (!(await latestKycApproved(tx, params.tenantId))) {
      throw new WalletError(
        "Complete KYC verification before requesting a payout.",
        "KYC_REQUIRED"
      );
    }

    await ensureTenantWallet(tx, params.tenantId);
    // Lock the wallet so two concurrent requests can't both spend the balance.
    const [wallet] = await tx
      .select()
      .from(tenantWallets)
      .where(eq(tenantWallets.tenantId, params.tenantId))
      .for("update");
    if (!wallet) throw new WalletError("Wallet not found.", "INVALID_AMOUNT");
    const availableCentavos = toCentavos(wallet.availableBalance);
    if (params.amountCentavos > availableCentavos) {
      throw new WalletError("Insufficient available balance.", "INSUFFICIENT_BALANCE");
    }

    const amount = fromCentavos(params.amountCentavos);
    const [payout] = await tx
      .insert(tenantPayouts)
      .values({
        tenantId: params.tenantId,
        amount,
        method: params.method,
        destinationAccount: params.destinationAccount,
        destinationName: params.destinationName,
        status: "queued",
        autoTriggered: params.autoTriggered ?? false,
      })
      .returning();

    await tx
      .update(tenantWallets)
      .set({
        availableBalance: subCentavos(wallet.availableBalance, params.amountCentavos),
        updatedAt: new Date(),
      })
      .where(eq(tenantWallets.tenantId, params.tenantId));

    await tx.insert(walletLedgerEntries).values({
      tenantId: params.tenantId,
      payoutId: payout!.id,
      type: "payout",
      status: "pending",
      grossAmount: amount,
      feeAmount: "0.00",
      netAmount: fromCentavos(-params.amountCentavos),
      description: `Payout to ${params.method.toUpperCase()} ${params.destinationAccount}`,
    });

    return { payoutId: payout!.id };
  });
}

/** Process queued payouts (simulated transfer — wire PayMongo/disbursement API here). */
export async function processQueuedPayouts(limit = 50): Promise<number> {
  // Simulated transfer: never mark payouts "completed" unless explicitly enabled.
  if (!walletPayoutsEnabled()) return 0;
  const db = getDb();
  const queued = await db
    .select()
    .from(tenantPayouts)
    .where(eq(tenantPayouts.status, "queued"))
    .orderBy(tenantPayouts.createdAt)
    .limit(limit);

  let processed = 0;
  for (const payout of queued) {
    await db.transaction(async (tx) => {
      const now = new Date();
      await tx
        .update(tenantPayouts)
        .set({ status: "completed", processedAt: now })
        .where(eq(tenantPayouts.id, payout.id));

      await tx
        .update(tenantWallets)
        .set({
          totalWithdrawn: sql`${tenantWallets.totalWithdrawn} + ${payout.amount}`,
          updatedAt: now,
        })
        .where(eq(tenantWallets.tenantId, payout.tenantId));

      await tx
        .update(walletLedgerEntries)
        .set({ status: "completed" })
        .where(
          and(
            eq(walletLedgerEntries.payoutId, payout.id),
            eq(walletLedgerEntries.type, "payout")
          )
        );
    });
    processed += 1;
  }
  return processed;
}

/** Auto-request payouts for tenants with auto-payout enabled and enough balance. */
export async function processAutoPayouts(): Promise<number> {
  if (!walletPayoutsEnabled()) return 0;
  const db = getDb();
  const minCentavos = minAutoPayoutCentavos();
  const activeTenants = await db
    .select({
      id: tenants.id,
      settingsJson: tenants.settingsJson,
    })
    .from(tenants)
    .where(eq(tenants.status, "active"));

  let triggered = 0;
  for (const tenant of activeTenants) {
    const settings = resolveWalletSettings(
      (tenant.settingsJson ?? {}) as Record<string, unknown>
    );
    if (!settings.autoPayoutEnabled) continue;
    if (!(await latestKycApproved(db, tenant.id))) continue;
    if (!settings.payoutMethod || !settings.payoutAccount || !settings.payoutAccountName) {
      continue;
    }

    const summary = await getWalletSummary(tenant.id);
    const availableCentavos = toCentavos(summary.availableBalance);
    if (availableCentavos < minCentavos) continue;

    try {
      await requestTenantPayout({
        tenantId: tenant.id,
        amountCentavos: availableCentavos,
        method: settings.payoutMethod,
        destinationAccount: settings.payoutAccount,
        destinationName: settings.payoutAccountName,
        autoTriggered: true,
      });
      triggered += 1;
    } catch {
      // Skip tenants that fail validation mid-flight (race on balance, etc.)
    }
  }
  return triggered;
}

export async function runWalletSettlement(): Promise<{
  released: number;
  autoPayouts: number;
  processedPayouts: number;
}> {
  const released = await releaseExpiredPendingCredits();
  const autoPayouts = await processAutoPayouts();
  const processedPayouts = await processQueuedPayouts();
  return { released, autoPayouts, processedPayouts };
}
