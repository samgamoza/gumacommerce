import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function WaggyFooter({ tenant }: { tenant: DemoTenant }) {
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const year = new Date().getFullYear();

  return (
    <footer className="waggy-footer" id="footer">
      <div className="waggy-container-lg">
        <div className="waggy-footer-grid">
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
                <a href="#categories">Categories</a>
              </li>
              <li>
                <a href="#products">Products</a>
              </li>
              <li>
                <Link href={checkoutHref}>Cart</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Help</h5>
            <ul>
              <li>
                <a href="#footer">Shipping</a>
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

        <div className="waggy-footer-bottom">
          <p>© Copyright {tenant.name} {year}.</p>
          <p>Powered by Guma Commerce</p>
        </div>
      </div>
    </footer>
  );
}
