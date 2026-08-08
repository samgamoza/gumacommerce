import {
  canUseTemplate,
  isShopTemplateId,
  normalizeStoreLook,
  previewImageForCategory,
  previewImageForTemplate,
  resolveStockSkin,
  sellerFacingStockLabel,
  type CatalogInstallResolution,
  type CuratedTemplateCard,
  type ShopTemplateId,
  type StockSkin,
} from "@guma-commerce/storefront-themes";
import type { TemplateStockRow } from "@guma-commerce/db";

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function stockRowToCuratedCard(
  row: TemplateStockRow,
  plan?: string | null
): CuratedTemplateCard | null {
  if (!isShopTemplateId(row.liveTemplateId)) return null;
  const live = row.liveTemplateId as ShopTemplateId;
  const skin = resolveStockSkin(row.storeLookJson, row.stockKey);
  const label = sellerFacingStockLabel({
    label: row.label,
    stockKey: row.stockKey,
    storeLookJson: row.storeLookJson,
  });
  return {
    proposedId: row.stockKey,
    label,
    shopCategory: row.categoryLabel,
    status: row.source === "ai_curated" ? "queued-storefront" : "variant-of-integrated",
    notes:
      row.notes ??
      `Ops stock · ${row.source.replace(/_/g, " ")} · ${live} · ${skin.paletteId}`,
    previewImageUrl: row.previewImageUrl || previewImageForCategory(row.categoryLabel),
    installTemplateId: live,
    installable: canUseTemplate(live, plan ?? "free"),
    usesLiveLabel: live,
    num: 9000 + (hashString(row.stockKey) % 900),
  };
}

export function resolveStockInstall(
  row: TemplateStockRow,
  plan?: string | null
): (CatalogInstallResolution & { stockSkin: StockSkin }) | null {
  if (row.status !== "published") return null;
  if (!isShopTemplateId(row.liveTemplateId)) return null;
  const liveTemplateId = row.liveTemplateId as ShopTemplateId;
  const stockSkin = resolveStockSkin(row.storeLookJson, row.stockKey);
  const storeLook = normalizeStoreLook(stockSkin);

  return {
    selectionId: row.stockKey,
    liveTemplateId,
    catalogEntry: null,
    catalogId: row.stockKey,
    catalogLabel: sellerFacingStockLabel({
      label: row.label,
      stockKey: row.stockKey,
      storeLookJson: row.storeLookJson,
    }),
    storeLook,
    stockSkin,
    previewImageUrl:
      row.previewImageUrl ||
      previewImageForCategory(row.categoryLabel) ||
      previewImageForTemplate(liveTemplateId),
    installableOnPlan: canUseTemplate(liveTemplateId, plan ?? "free"),
    fromCatalog: true,
  };
}

export function mergeCuratedWithStock(
  curated: CuratedTemplateCard[],
  stock: TemplateStockRow[],
  plan?: string | null,
  limit = 48
): CuratedTemplateCard[] {
  const seen = new Set(curated.map((c) => c.proposedId));
  const extras: CuratedTemplateCard[] = [];
  for (const row of stock) {
    if (seen.has(row.stockKey)) continue;
    const card = stockRowToCuratedCard(row, plan);
    if (!card) continue;
    seen.add(row.stockKey);
    extras.push(card);
  }
  return [...extras, ...curated].slice(0, limit);
}
