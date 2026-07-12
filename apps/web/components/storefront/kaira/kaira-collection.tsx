import Image from "next/image";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";
import { KAIRA_COLLECTION_IMAGE } from "./kaira-utils";

export function KairaCollection({ tenant }: { tenant: DemoTenant }) {
  return (
    <section className="kaira-section" id="collection">
      <div className="kaira-container">
        <div className="kaira-collection">
          <Image
            src={tenant.coverUrl ?? KAIRA_COLLECTION_IMAGE}
            alt="Collection"
            width={700}
            height={500}
            className="min-h-[320px]"
          />
          <div className="kaira-collection-copy">
            <h3>{tenant.shopTheme.promoTitle ?? "Classic Winter Collection"}</h3>
            <p className="leading-relaxed">
              {tenant.tagline} Explore curated pieces designed for everyday elegance — from tailored layers to
              statement accessories, delivered with COD and free returns.
            </p>
            <Link href={`/${tenant.slug}#products`} className="kaira-btn kaira-btn-dark mt-4 inline-flex w-fit">
              Shop Collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
