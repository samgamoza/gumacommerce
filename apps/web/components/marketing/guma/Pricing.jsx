'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Reveal from './Reveal';

const tiers = [
  {
    name: 'Free',
    tagline: 'For home bakers, thrift shops & boutique creators launching a real storefront link.',
    monthly: 0,
    annual: 0,
    features: [
      '1 storefront',
      'Manual GCash / Maya / COD checkout',
      'Book courier or assign rider',
      'Helpdesk + community support',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    tagline: 'For growing social sellers who want Workspace AI and higher limits.',
    monthly: 499,
    annual: 499,
    features: [
      'Everything in Free',
      'GUMA Workspace + AI assistants',
      'PayMongo gateway when keys enabled',
      'Lalamove / Grab booking when keyed',
      'Higher AI quotas',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Advance',
    tagline: 'For high-volume sellers who need advanced campaigns and priority support.',
    monthly: 999,
    annual: 999,
    features: [
      'Everything in Pro',
      'Advanced campaigns',
      'Priority support',
      'Higher automation limits',
      'Same honest logistics story — Book / Assign, not fake auto-dispatch',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="max-w-7xl mx-auto px-6 py-32">
      <Reveal className="text-center mb-12">
        <span className="font-mono text-xs tracking-[0.2em] text-[#A78BFA] uppercase">
          // Tiered Growth Engine
        </span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4 tracking-tight">
          Pricing that scales <span className="text-gradient-purple">with you</span>
        </h2>
      </Reveal>

      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm font-body ${!annual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className="relative w-14 h-7 rounded-full bg-slate-700 transition-colors"
          aria-label="Toggle billing period"
        >
          <div
            className={`absolute top-1 w-5 h-5 rounded-full bg-gradient-to-r from-[#A78BFA] to-[#818CF8] transition-transform ${
              annual ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-body ${annual ? 'text-white' : 'text-slate-500'}`}>
          Annual <span className="text-[#34D399] text-xs font-mono">−20%</span>
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {tiers.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1} className="h-full">
            <div
              className={`relative rounded-3xl p-8 h-full flex flex-col group ${
                t.popular ? 'glass-strong border-2 border-[#A78BFA] glow-purple' : 'glass border border-slate-700/40'
              }`}
            >
              {/* Corner brackets */}
              <span className={`absolute top-3 left-3 w-3 h-3 border-t border-l ${t.popular ? 'border-[#A78BFA]/60' : 'border-slate-500/30'} pointer-events-none`} />
              <span className={`absolute top-3 right-3 w-3 h-3 border-t border-r ${t.popular ? 'border-[#A78BFA]/60' : 'border-slate-500/30'} pointer-events-none`} />
              <span className={`absolute bottom-3 left-3 w-3 h-3 border-b border-l ${t.popular ? 'border-[#A78BFA]/60' : 'border-slate-500/30'} pointer-events-none`} />
              <span className={`absolute bottom-3 right-3 w-3 h-3 border-b border-r ${t.popular ? 'border-[#A78BFA]/60' : 'border-slate-500/30'} pointer-events-none`} />

              {t.popular && (
                <>
                  <div
                    className="absolute inset-0 rounded-3xl opacity-20 animate-aurora pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, #A78BFA, #34D399, #6366F1)' }}
                  />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-[#0A0F1D] bg-gradient-to-r from-[#A78BFA] to-[#818CF8] px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                </>
              )}
              <div className="relative flex flex-col flex-1">
                <h3 className="font-display text-xl font-bold text-white">{t.name}</h3>
                <p className="font-body text-sm text-slate-400 mt-1 mb-6">{t.tagline}</p>
                <div className="mb-6">
                  <motion.span
                    key={annual ? `a-${t.annual}` : `m-${t.monthly}`}
                    initial={{ y: -16, opacity: 0, filter: 'blur(4px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-4xl font-bold text-white inline-block"
                  >
                    ₱{annual ? t.annual : t.monthly}
                  </motion.span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                <button
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all mb-6 ${
                    t.popular
                      ? 'bg-gradient-to-r from-[#A78BFA] to-[#818CF8] text-white hover:scale-[1.02]'
                      : 'glass text-white hover:bg-slate-700/50'
                  }`}
                >
                  {t.cta}
                </button>
                <div className="space-y-3">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#34D399] flex-shrink-0" />
                      <span className="text-sm text-slate-300 font-body">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}