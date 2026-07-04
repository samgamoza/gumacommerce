import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { adminUrl } from "@/lib/utils";
import { ShopifyRelatedProducts } from "./shopify-catalog";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function ShopifyProductStage({
  tenant,
  product,
}: {
  tenant: DemoTenant;
  product: DemoProduct;
}) {
  const accent = tenant.shopTheme?.primaryColor ?? tenant.theme.primaryColor;
  const breadcrumb = `${tenant.name.toUpperCase()} › ${product.category.toUpperCase()}`;

  return (
    <>
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link
            href={`/${tenant.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link
            href={`${adminUrl}/products`}
            className="hidden rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex"
          >
            Edit product
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-neutral-100">
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {breadcrumb}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {product.title}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-semibold md:text-3xl">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-lg text-neutral-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p className="mt-6 text-base leading-relaxed text-neutral-600 md:text-lg">
              {product.shortDescription}
            </p>

            <Link
              href={`/${tenant.slug}/checkout`}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition hover:opacity-90 md:max-w-md"
              style={{ backgroundColor: accent }}
            >
              Add to Cart
            </Link>

            <div className="mt-6 flex flex-wrap gap-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Secure payment
              </span>
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Fast delivery
              </span>
            </div>
          </div>
        </div>
      </main>

      <ShopifyRelatedProducts tenant={tenant} currentProductId={product.id} />
    </>
  );
}
