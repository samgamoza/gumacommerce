import { Award, ShieldCheck, ShoppingCart, Tag } from "lucide-react";

const SERVICES = [
  { icon: ShoppingCart, title: "Free delivery", description: "Complimentary shipping on qualifying tech orders." },
  { icon: Award, title: "Quality guarantee", description: "Official warranty on phones, laptops, and accessories." },
  { icon: Tag, title: "Daily offers", description: "Fresh deals on gadgets and smart devices every week." },
  { icon: ShieldCheck, title: "100% secure payment", description: "Safe checkout with COD and online payment options." },
] as const;

export function MinistoreServices() {
  return (
    <section className="ministore-services" id="services">
      <div className="ministore-container-lg">
        <div className="ministore-service-grid">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="ministore-service">
                <Icon className="ministore-service-icon h-10 w-10" aria-hidden />
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
