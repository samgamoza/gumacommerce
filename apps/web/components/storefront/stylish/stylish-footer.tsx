import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function StylishFooter({ tenant }: { tenant: DemoTenant }) {
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const year = new Date().getFullYear();

  return (
    <footer className="stylish-footer" id="footer">
      <div className="stylish-container">
        <div className="stylish-footer-grid">
          <div>
            <h5>Info</h5>
            <ul>
              <li>
                <a href="#footer">Track Your Order</a>
              </li>
              <li>
                <Link href={homeHref}>Our Blog</Link>
              </li>
              <li>
                <a href="#footer">Shipping</a>
              </li>
              <li>
                <a href="#footer">Contact Us</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>About</h5>
            <ul>
              <li>
                <a href="#footer">Our Story</a>
              </li>
              <li>
                <a href="#footer">Services</a>
              </li>
              <li>
                <Link href={homeHref}>Stores</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Women</h5>
            <ul>
              <li>
                <a href="#products">Running</a>
              </li>
              <li>
                <a href="#products">Casual</a>
              </li>
              <li>
                <a href="#products">Sneakers</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>Popular</h5>
            <ul>
              <li>
                <a href="#products">New Products</a>
              </li>
              <li>
                <a href="#products">Best Sales</a>
              </li>
              <li>
                <Link href={checkoutHref}>Cart</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Men</h5>
            <ul>
              <li>
                <a href="#products">Sports</a>
              </li>
              <li>
                <a href="#products">Boots</a>
              </li>
              <li>
                <a href="#products">Loafers</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>Get In Touch</h5>
            <div className="stylish-footer-contact">
              <span>{tenant.name}</span>
              <span>{tenant.location}</span>
              {tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone && (
                <span>Call us: {tenant.storeSettings.whatsapp.phone}</span>
              )}
              <span>{tenant.tagline}</span>
            </div>
          </div>
        </div>

        <div className="stylish-footer-bottom">
          <p>© Copyright {tenant.name} {year}.</p>
          <p>Powered by Guma One</p>
        </div>
      </div>
    </footer>
  );
}
