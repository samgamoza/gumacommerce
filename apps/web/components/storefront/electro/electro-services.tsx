import { CreditCard, Headphones, RefreshCw, Shield, ShoppingCart, Truck } from "lucide-react";

const SERVICES = [
  { icon: RefreshCw, title: "Free Return", desc: "30 days money back guarantee" },
  { icon: Truck, title: "Free Shipping", desc: "Free shipping on all orders" },
  { icon: Headphones, title: "Support 24/7", desc: "We support online 24 hrs a day" },
  { icon: CreditCard, title: "Gift Cards", desc: "Receive gift on orders over ₱2,500" },
  { icon: Shield, title: "Secure Payment", desc: "We value your security" },
  { icon: ShoppingCart, title: "Online Service", desc: "Free returns within 30 days" },
];

export function ElectroServices() {
  return (
    <section className="electro-services" aria-label="Store services">
      {SERVICES.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="electro-service-item">
          <Icon className="h-8 w-8" />
          <div>
            <h6>{title}</h6>
            <p>{desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
