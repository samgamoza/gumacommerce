import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function FoodmartFooter({ tenant }: { tenant: DemoTenant }) {
  const phone =
    tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
      ? tenant.storeSettings.whatsapp.phone
      : null;
  const email = `${tenant.slug.replace(/-/g, "")}@gumacommerce.app`;

  return (
    <footer className="foodmart-footer" id="footer">
      <div className="foodmart-container">
        <div className="foodmart-footer-grid">
          <div>
            <h5>{tenant.name}</h5>
            <p className="text-sm leading-relaxed">{tenant.tagline}</p>
          </div>
          <div>
            <h5>Quick Links</h5>
            <ul className="foodmart-footer-links">
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
          <div>
            <h5>Contact</h5>
            <ul className="foodmart-footer-links">
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
              {phone && (
                <li>
                  <a href={`tel:${phone}`}>{phone}</a>
                </li>
              )}
              <li>{tenant.location}</li>
            </ul>
          </div>
        </div>
        <div className="foodmart-footer-bar">
          &copy; {new Date().getFullYear()} {tenant.name}. COD & delivery available in {tenant.location}.
        </div>
      </div>
    </footer>
  );
}
