import { Headphones, ShieldCheck, Truck } from "lucide-react";

const SERVICES = [
  {
    icon: Truck,
    title: "Free Delivery",
    description: "On orders above minimum spend in Metro Manila.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Guarantee",
    description: "Trusted pet brands and vet-approved products.",
  },
  {
    icon: Headphones,
    title: "Pet Care Support",
    description: "Friendly advice for dogs, cats, birds, and more.",
  },
] as const;

export function WaggyServices() {
  return (
    <section className="waggy-section pt-0">
      <div className="waggy-container-lg">
        <div className="waggy-services">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="waggy-service">
                <Icon className="mx-auto h-10 w-10 text-[var(--wg-primary)]" aria-hidden />
                <h4>{service.title}</h4>
                <p>{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
