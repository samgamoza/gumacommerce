'use client';
import Reveal from './Reveal';
import { ShieldCheck, Lock, Quote } from 'lucide-react';

const badges = [
  { icon: ShieldCheck, label: 'NPC Compliant', sub: 'Data Privacy Act of 2012' },
  { icon: Lock, label: '256-bit Encryption', sub: 'Bank-grade security' },
];

export default function SocialProof() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-24">
      <Reveal>
        <div className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div
            className="absolute -top-40 right-0 w-[400px] h-[300px] rounded-full blur-[100px] opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #34D399, transparent 70%)' }}
          />

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12 relative">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.label} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                  <Icon className="w-5 h-5 text-[#34D399]" />
                  <div>
                    <div className="text-sm font-semibold text-white">{b.label}</div>
                    <div className="font-mono text-[10px] text-slate-400">{b.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Testimonial */}
          <div className="relative text-center max-w-3xl mx-auto">
            <Quote className="w-10 h-10 text-[#A78BFA]/30 mx-auto mb-4" />
            <p className="font-body text-lg md:text-xl text-white leading-relaxed">
              "Before Guma One.Ai, our team was up until 2 AM booking riders manually and verifying GCash receipts.
              Now, the orders flow directly to our kitchen, payments are settled, and the rider is already waiting
              at our door before we even finish packing the order."
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#6366F1] flex items-center justify-center font-display font-bold text-white text-sm">
                V
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Veyron</div>
                <div className="font-mono text-[10px] text-slate-400">Founder, Veyron's Bakery</div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}