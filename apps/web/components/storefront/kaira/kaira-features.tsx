import { Calendar, Gift, RefreshCw, ShoppingBag } from "lucide-react";

const FEATURES = [
  { icon: Calendar, title: "Book An Appointment", desc: "Personal styling sessions in-store or online." },
  { icon: ShoppingBag, title: "Pick Up In Store", desc: "Order online and collect at your nearest branch." },
  { icon: Gift, title: "Special Packaging", desc: "Gift-ready packaging on every order." },
  { icon: RefreshCw, title: "Free Global Returns", desc: "Easy returns within 30 days." },
];

export function KairaFeatures() {
  return (
    <section className="kaira-section" aria-label="Store features">
      <div className="kaira-container">
        <div className="kaira-features">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="kaira-feature">
              <Icon className="mx-auto h-9 w-9" />
              <h4>{title}</h4>
              <p className="text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
