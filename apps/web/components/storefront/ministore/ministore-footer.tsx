import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function MinistoreFooter({ tenant }: { tenant: DemoTenant }) {
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const year = new Date().getFullYear();

  return (
    <footer className="ministore-footer" id="footer">
      <div className="ministore-container-lg">
        <div className="ministore-footer-grid">
          <div>
            <h5>{tenant.name}</h5>
            <p className="text-sm leading-relaxed">{tenant.tagline}</p>
            <p className="mt-3 text-sm">{tenant.location}</p>
          </div>
          <div>
            <h5>Shop</h5>
            <ul>
              <li>
                <Link href={homeHref}>Home</Link>
              </li>
              <li>
                <a href="#mobile-products">Mobile</a>
              </li>
              <li>
                <a href="#watches">Watches</a>
              </li>
              <li>
                <Link href={checkoutHref}>Cart</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Support</h5>
            <ul>
              <li>
                <a href="#footer">Warranty</a>
              </li>
              <li>
                <a href="#footer">Returns</a>
              </li>
              <li>
                <a href="#footer">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="ministore-footer-bottom">
          <p>
            © {tenant.name} {year}. All rights reserved.
          </p>
          <p>Powered by Guma One</p>
        </div>
      </div>
    </footer>
  );
}
