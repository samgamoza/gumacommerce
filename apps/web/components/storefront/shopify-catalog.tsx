import Link from "next/link";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { StorefrontProductImage } from "@/components/storefront/storefront-product-image";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function ShopifyCatalog({
  tenant,
  activeCategorySlug,
}: {
  tenant: DemoTenant;
  activeCategorySlug?: string;
}) {
  const filtered = activeCategorySlug
    ? tenant.products.filter((product) => product.categorySlug === activeCategorySlug)
    : tenant.products;

  const accent = tenant.shopTheme?.primaryColor ?? tenant.theme.primaryColor;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <div className="space-y-4">
        {(tenant.shopTheme.promoTitle || tenant.shopTheme.promoSubtitle) && (
          <div
            className="mb-8 rounded-3xl px-6 py-5 text-white md:px-8"
            style={{ backgroundColor: accent }}
          >
            {tenant.shopTheme.promoTitle && (
              <p className="text-lg font-bold md:text-xl">{tenant.shopTheme.promoTitle}</p>
            )}
            {tenant.shopTheme.promoSubtitle && (
              <p className="mt-1 text-sm text-white/90">{tenant.shopTheme.promoSubtitle}</p>
            )}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            {tenant.category}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {activeCategorySlug
              ? tenant.shopCategories.find((c) => c.slug === activeCategorySlug)?.name ??
                "Products"
              : "All products"}
          </h1>
          <p className="mt-2 max-w-xl text-neutral-600">{tenant.tagline}</p>
        </div>

        {tenant.shopCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${tenant.slug}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                !activeCategorySlug
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              All
            </Link>
            {tenant.shopCategories.map((category) => (
              <Link
                key={category.id}
                href={`/${tenant.slug}?category=${category.slug}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategorySlug === category.slug
                    ? "text-white"
                    : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
                style={
                  activeCategorySlug === category.slug
                    ? { backgroundColor: accent }
                    : undefined
                }
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/50 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
            🛍️
          </span>
          <p className="mt-4 text-lg font-semibold">No products yet</p>
          <p className="mt-1 text-sm text-neutral-500">Check back soon for new items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 lg:grid-cols-3">
          {filtered.map((product) => (
            <ShopifyProductTile key={product.id} tenant={tenant} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}

function ShopifyProductTile({
  tenant,
  product,
}: {
  tenant: DemoTenant;
  product: DemoProduct;
}) {
  return (
    <Link href={`/${tenant.slug}/products/${product.slug}`} className="group block">
      <article>
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 md:rounded-3xl">
          <StorefrontProductImage
            src={product.image}
            alt={product.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>
        <div className="mt-4 space-y-1">
          <h2 className="text-sm font-medium leading-snug text-neutral-900 md:text-base">
            {product.title}
          </h2>
          <p className="text-sm font-semibold text-neutral-900 md:text-base">
            {formatPrice(product.price)}
          </p>
        </div>
      </article>
    </Link>
  );
}

export function ShopifyRelatedProducts({
  tenant,
  currentProductId,
}: {
  tenant: DemoTenant;
  currentProductId: string;
}) {
  const related = tenant.products.filter((product) => product.id !== currentProductId).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 bg-neutral-50/80 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <h2 className="font-display text-2xl font-bold tracking-tight">You may also like</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {related.map((product) => (
            <ShopifyProductTile key={product.id} tenant={tenant} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
