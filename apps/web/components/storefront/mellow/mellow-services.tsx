import { Armchair, ChefHat, Dumbbell, Sparkles, Waves, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SERVICES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Sparkles,
    title: "Spa & Wellness",
    description:
      "Rejuvenate with spa treatments, yoga sessions, and meditation classes led by experienced instructors in serene surroundings.",
  },
  {
    icon: ChefHat,
    title: "Dining",
    description:
      "Savor local and international cuisine at our restaurant and in-room dining — from breakfast buffets to sunset cocktails.",
  },
  {
    icon: Waves,
    title: "Rooftop Pool",
    description:
      "Relax by the rooftop pool with panoramic views — the perfect spot to unwind after a day of exploring.",
  },
  {
    icon: Dumbbell,
    title: "Fitness Center",
    description: "Stay active with modern cardio and strength equipment available 24/7 for registered guests.",
  },
  {
    icon: Armchair,
    title: "Event Spaces",
    description: "Host weddings, conferences, and celebrations in flexible indoor and outdoor venues.",
  },
  {
    icon: Wifi,
    title: "Free Wi-Fi",
    description: "High-speed wireless internet throughout the property for work and leisure.",
  },
];

export function MellowServices() {
  return (
    <section className="mellow-section" id="services">
      <div className="mellow-container-fluid">
        <h2 className="mellow-section-title">Our services & facilities</h2>
        <div className="mellow-services-grid">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <article key={service.title} className="mellow-service-card">
                <Icon className="mellow-service-icon mx-auto h-12 w-12" aria-hidden />
                <h4>{service.title}</h4>
                <p>{service.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
