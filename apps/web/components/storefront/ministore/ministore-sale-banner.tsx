import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function MinistoreSaleBanner({ tenant }: { tenant: DemoTenant }) {
  const shopHref = `/${tenant.slug}#mobile-products`;

  return (
    <section className="ministore-sale" id="sale">
      <div className="ministore-container-lg">
        <h3>10% off</h3>
        <h2>New Year Tech Sale</h2>
        <p className="mb-4 max-w-md">{tenant.shopTheme.promoSubtitle}</p>
        <Link href={shopHref} className="ministore-btn-dark">
          Shop Sale
        </Link>
      </div>
    </section>
  );
}
