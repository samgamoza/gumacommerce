'use client';
import Reveal from './Reveal';
import { MessageCircle, CreditCard, Truck } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: MessageCircle,
    title: 'Customer Comments',
    desc: 'Buyer comments "Buy" or "HM" on your Facebook, TikTok, or Instagram post. Guma One.Ai instantly replies with a secure checkout link — no DMs, no waiting, no "PM sent".',
    accent: '#A78BFA',
  },
  {
    num: '02',
    icon: CreditCard,
    title: '1-Tap Payment',
    desc: 'Customer pays via GCash, Maya, or GoTyme. Our system validates the transaction in real time — no more squinting at screenshots or worrying about fake receipts.',
    accent: '#34D399',
  },
  {
    num: '03',
    icon: Truck,
    title: 'Auto-Dispatch Rider',
    desc: 'The moment payment clears, Guma One.Ai auto-books the nearest Lalamove, Angkas, or Move It rider. Customer gets an SMS/Viber tracking link instantly.',
    accent: '#818CF8',
  },
];

export default function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <Reveal className="text-center mb-16">
        <span className="font-mono text-xs tracking-[0.2em] text-[#A78BFA] uppercase">
          // How It Works for Customers
        </span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4 tracking-tight">
          Three taps from <span className="text-gradient-purple">comment to doorstep</span>
        </h2>
        <p className="font-body text-slate-400 mt-4 max-w-2xl mx-auto text-lg">
          Your buyers never leave their feed. The entire checkout flow happens in seconds — no app downloads, no account creation.
        </p>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-6 relative">
        {/* Connecting line */}
        <div
          className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.3), rgba(52, 211, 153, 0.3), rgba(129, 140, 248, 0.3), transparent)' }}
        />

        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.num} delay={i * 0.15}>
              <div className="glass rounded-3xl p-8 h-full relative group hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `${s.accent}15`, border: `1px solid ${s.accent}30` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: s.accent }} />
                  </div>
                  <span className="font-mono text-3xl font-bold text-white/5">{s.num}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="font-body text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}