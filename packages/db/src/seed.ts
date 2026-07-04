import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "./client";
import { categories, products, productVariants, tenants } from "./schema/index";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: path.join(rootDir, ".env") });

async function seed() {
  const db = getDb();

  const existing = await db.select().from(tenants).where(eq(tenants.slug, "demo")).limit(1);
  if (existing.length > 0) {
    console.log("Demo tenant already exists — skipping seed.");
    return;
  }

  console.log("Seeding demo tenant...");

  const [tenant] = await db
    .insert(tenants)
    .values({
      slug: "demo",
      name: "Halo Queen Manila",
      legalName: "Halo Queen Food Services",
      category: "Food & Beverage",
      themeJson: { primaryColor: "#059669", accentColor: "#f59e0b" },
      localeDefault: "taglish",
      settingsJson: { codEnabled: true, autoAcceptOrders: false, minOrderAmount: 99 },
      subscriptionPlan: "pro",
    })
    .returning();

  if (!tenant) throw new Error("Failed to create demo tenant");

  const [category] = await db
    .insert(categories)
    .values({
      tenantId: tenant.id,
      name: "Best Sellers",
      slug: "best-sellers",
      sortOrder: 0,
    })
    .returning();

  const catalog = [
    {
      title: "Premium Halo-Halo",
      slug: "premium-halo-halo",
      basePrice: "149.00",
      compareAtPrice: "179.00",
      descriptionHtml: "<p>Beat the Manila heat with our bestselling premium halo-halo.</p>",
    },
    {
      title: "Ube Special Halo-Halo",
      slug: "ube-special",
      basePrice: "169.00",
      descriptionHtml: "<p>Extra ube halaya for ube lovers.</p>",
    },
    {
      title: "Family Bucket (4 cups)",
      slug: "family-bucket",
      basePrice: "499.00",
      compareAtPrice: "596.00",
      descriptionHtml: "<p>Perfect for barkada nights.</p>",
    },
  ];

  for (const item of catalog) {
    const [product] = await db
      .insert(products)
      .values({
        tenantId: tenant.id,
        categoryId: category?.id,
        title: item.title,
        slug: item.slug,
        descriptionHtml: item.descriptionHtml,
        status: "active",
        basePrice: item.basePrice,
        compareAtPrice: item.compareAtPrice ?? null,
        metadataJson: { prepTimeMinutes: 15 },
      })
      .returning();

    if (product) {
      await db.insert(productVariants).values({
        productId: product.id,
        sku: `${item.slug}-default`,
        title: "Regular",
        price: item.basePrice,
        stockQty: 50,
        optionsJson: { size: "Regular" },
      });
    }
  }

  console.log("Seed complete.");
  console.log("  Storefront: http://localhost:3000/demo");
  console.log("  Admin:      http://localhost:3001");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => closeDb());
