import { Headphones, RefreshCw, ShieldCheck, Truck } from "lucide-react";

const FEATURES = [
  { icon: Truck, title: "Free Shipping", description: "Free on orders over ₱999" },
  { icon: ShieldCheck, title: "Secure Payment", description: "100% secure checkout" },
  { icon: RefreshCw, title: "30 Day Return", description: "30-day freshness guarantee" },
  { icon: Headphones, title: "24/7 Support", description: "Fast help when you need it" },
] as const;

export function FruitablesFeatures() {
  return (
    <section className="fruitables-features">
      <div className="fruitables-container-lg">
        <div className="fruitables-feature-grid">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="fruitables-feature">
                <div className="fruitables-feature-icon">
                  <Icon className="h-7 w-7" aria-hidden />
                </div>
                <h5>{feature.title}</h5>
                <p>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
