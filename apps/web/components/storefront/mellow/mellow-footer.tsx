import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function MellowFooter({ tenant }: { tenant: DemoTenant }) {
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const year = new Date().getFullYear();

  return (
    <footer className="mellow-footer" id="footer">
      <div className="mellow-container-fluid">
        <div className="mellow-footer-grid">
          <div>
            <h5>{tenant.name}</h5>
            <p className="text-sm leading-relaxed text-[var(--ml-muted)]">{tenant.tagline}</p>
            <p className="mt-3 text-sm text-[var(--ml-muted)]">{tenant.location}</p>
          </div>
          <div>
            <h5>Explore</h5>
            <ul>
              <li>
                <Link href={homeHref}>Home</Link>
              </li>
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#rooms">Rooms</a>
              </li>
              <li>
                <a href="#gallery">Gallery</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>Services</h5>
            <ul>
              <li>
                <a href="#services">Spa & Wellness</a>
              </li>
              <li>
                <a href="#services">Dining</a>
              </li>
              <li>
                <a href="#services">Events</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>Book</h5>
            <ul>
              <li>
                <a href="#rooms">Check Availability</a>
              </li>
              <li>
                <Link href={checkoutHref}>Complete Booking</Link>
              </li>
              <li>
                <a href="#footer">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mellow-footer-bottom">
          <p>© Copyright {tenant.name} {year}.</p>
          <p>Powered by Guma One</p>
        </div>
      </div>
    </footer>
  );
}
