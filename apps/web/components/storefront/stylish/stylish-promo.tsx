import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function StylishPromo({ tenant }: { tenant: DemoTenant }) {
  return (
    <section className="stylish-coupon">
      <div className="stylish-container">
        <div className="stylish-coupon-inner">
          <div className="stylish-coupon-badge">10% OFF</div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2>10% OFF Discount Coupons</h2>
              <p>Subscribe to {tenant.name} and get 10% off your first purchase.</p>
            </div>
            <Link href={`/${tenant.slug}#products`} className="stylish-btn">
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
