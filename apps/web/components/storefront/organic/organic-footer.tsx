import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function OrganicFooter({ tenant }: { tenant: DemoTenant }) {
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const year = new Date().getFullYear();

  return (
    <footer className="organic-footer" id="footer">
      <div className="organic-container-lg">
        <div className="organic-footer-grid">
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
                <a href="#products">Fresh Produce</a>
              </li>
              <li>
                <a href="#categories">Categories</a>
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
                <a href="#footer">Delivery Info</a>
              </li>
              <li>
                <a href="#footer">Farm Partners</a>
              </li>
              <li>
                <a href="#footer">Contact Us</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="organic-footer-bottom">
          <p>© Copyright {tenant.name} {year}.</p>
          <p>Powered by Guma Commerce</p>
        </div>
      </div>
    </footer>
  );
}
