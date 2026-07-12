import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";
import { electroBrandName } from "./electro-utils";

export function ElectroFooter({ tenant }: { tenant: DemoTenant }) {
  const brand = electroBrandName(tenant.name);
  const phone =
    tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
      ? tenant.storeSettings.whatsapp.phone
      : null;
  const email = `${tenant.slug.replace(/-/g, "")}@gumacommerce.app`;
  const categories = tenant.shopCategories.length
    ? tenant.shopCategories
    : [...new Set(tenant.products.map((p) => p.category))].slice(0, 6).map((name, i) => ({
        id: `f-${i}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      }));

  return (
    <footer className="electro-footer" id="footer">
      <div className="electro-container">
        <div className="electro-footer-grid">
          <div>
            <h3>{brand}</h3>
            <ul className="electro-footer-links">
              <li>{tenant.location}</li>
              {phone && (
                <li>
                  <a href={`tel:${phone}`}>{phone}</a>
                </li>
              )}
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="!text-white">Products</h3>
            <ul className="electro-footer-links">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a href="#products">{cat.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="!text-white">Further Info</h3>
            <ul className="electro-footer-links">
              <li>
                <Link href={`/${tenant.slug}`}>Home</Link>
              </li>
              <li>
                <a href="#products">Shop</a>
              </li>
              <li>
                <Link href={`/${tenant.slug}/checkout`}>Checkout</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="electro-footer-bar">
        <div className="electro-container">
          &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
