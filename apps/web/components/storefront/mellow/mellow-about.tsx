import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function MellowAbout({ tenant }: { tenant: DemoTenant }) {
  return (
    <section className="mellow-section" id="about">
      <div className="mellow-container-fluid">
        <h2 className="mellow-section-title">{tenant.name}: Your Gateway to Serenity</h2>
        <div className="mellow-about-grid">
          <div>
            <div className="mellow-about-copy">
              <p>{tenant.tagline}</p>
              <p className="mt-4">
                Welcome to {tenant.name}, where comfort meets tranquility. Nestled in {tenant.location}, our property
                offers a peaceful retreat for both business and leisure travelers — modern amenities, warm hospitality,
                and thoughtfully designed spaces.
              </p>
              <Link href={`/${tenant.slug}#rooms`} className="mellow-btn mt-4">
                Read About Us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Image
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80"
              alt={`${tenant.name} lobby`}
              width={640}
              height={420}
              className="mt-4 rounded-[1.25rem]"
            />
          </div>
          <div className="mellow-about-images">
            <Image
              src="https://images.unsplash.com/photo-1611892440504-42a792e284de?w=900&q=80"
              alt={`${tenant.name} suite`}
              width={640}
              height={480}
            />
            <Image
              src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=80"
              alt={`${tenant.name} pool`}
              width={640}
              height={360}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
