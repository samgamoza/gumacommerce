"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatSarabPrice, splitSarabBrand } from "./sarab-utils";

function SarabMenuCard({
  tenantSlug,
  product,
}: {
  tenantSlug: string;
  product: DemoProduct;
}) {
  const { addItem } = useCart(tenantSlug);
  const [justAdded, setJustAdded] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;

  function handleAdd(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: Number(product.price),
      image: product.image,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <article className="sarab-mcard">
      <Link href={productHref}>
        <div className="sarab-mimg">
          <Image src={product.image} alt={product.title} width={400} height={215} className="h-full w-full object-cover" />
          {product.tags.includes("bestseller") && <div className="sarab-mbdg">Best Seller</div>}
          {product.tags.includes("new") && <div className="sarab-mbdg">New</div>}
        </div>
      </Link>
      <div className="sarab-mbody">
        <div className="sarab-mcat">{product.category}</div>
        <Link href={productHref}>
          <div className="sarab-mtit">{product.title}</div>
        </Link>
        <p className="sarab-mdesc line-clamp-2">{product.shortDescription}</p>
        <div className="sarab-mfoot">
          <div className="sarab-mprice">
            {formatSarabPrice(product.price)}
            {product.compareAtPrice && (
              <small>{formatSarabPrice(product.compareAtPrice)}</small>
            )}
          </div>
          <button
            type="button"
            className={`sarab-madd${justAdded ? " is-added" : ""}`}
            aria-label={justAdded ? "Added to cart" : "Add to cart"}
            onClick={handleAdd}
          >
            {justAdded ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}

export function SarabMenu({ tenant }: { tenant: DemoTenant }) {
  const categories = useMemo(() => {
    const cats = [...new Set(tenant.products.map((p) => p.category))];
    return ["All", ...cats];
  }, [tenant.products]);

  const [active, setActive] = useState("All");

  const filtered =
    active === "All"
      ? tenant.products
      : tenant.products.filter((p) => p.category === active);

  return (
    <section className="sarab-menu" id="menu">
      <div className="sarab-container">
        <div className="text-center">
          <span className="sarab-slbl">What&apos;s Cooking</span>
          <h2 className="sarab-stitle">
            Our Delicious <span>Menu</span>
          </h2>
          <div className="sarab-sline" />
        </div>

        {categories.length > 1 && (
          <div className="sarab-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`sarab-filtbtn ${active === cat ? "active" : ""}`}
                onClick={() => setActive(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-center text-neutral-500">No menu items yet.</p>
        ) : (
          <div className="sarab-mgrid">
            {filtered.map((product) => (
              <SarabMenuCard key={product.id} tenantSlug={tenant.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function SarabFooter({ tenant }: { tenant: DemoTenant }) {
  const { lead, accent } = splitSarabBrand(tenant.name);
  const year = new Date().getFullYear();
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;

  return (
    <footer className="sarab-footer">
      <div className="sarab-container">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="sarab-fnm">
              {lead}
              <span>{accent}</span>
            </div>
            <p className="sarab-fdesc">{tenant.tagline || tenant.shopTheme.tagline}</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Quick links</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={homeHref} className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href={`/${tenant.slug}#menu`} className="hover:text-white">
                  Menu
                </Link>
              </li>
              <li>
                <Link href={checkoutHref} className="hover:text-white">
                  Cart & checkout
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="sarab-fbot">
          <div className="sarab-container sarab-fbot-inner">
            <p>
              © {year} <strong>{tenant.name}</strong>. Powered by{" "}
              <strong>Guma One</strong>.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
