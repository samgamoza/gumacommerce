import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function KairaFooter({ tenant }: { tenant: DemoTenant }) {
  const phone =
    tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
      ? tenant.storeSettings.whatsapp.phone
      : null;
  const email = `${tenant.slug.replace(/-/g, "")}@gumacommerce.app`;

  return (
    <footer className="kaira-footer" id="footer">
      <div className="kaira-container">
        <div className="kaira-footer-grid">
          <div>
            <h5>{tenant.name}</h5>
            <p className="text-sm leading-relaxed">{tenant.tagline}</p>
          </div>
          <div>
            <h5>Quick Links</h5>
            <ul className="kaira-footer-links">
              <li>
                <Link href={`/${tenant.slug}`}>Home</Link>
              </li>
              <li>
                <a href="#products">Shop</a>
              </li>
              <li>
                <Link href={`/${tenant.slug}/checkout`}>Cart</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Contact Us</h5>
            <ul className="kaira-footer-links">
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
        <div className="kaira-footer-bar">
          &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
