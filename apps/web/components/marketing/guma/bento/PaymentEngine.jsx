'use client';
import { useState } from 'react';

const payments = [
  {
    name: 'GCash',
    color: '#0EA5E9',
    initial: 'G',
    note: 'Payment Received ₱450',
    sub: 'Instant reconciliation · Fake-proof',
    grad: 'from-sky-500/20',
  },
  {
    name: 'Maya',
    color: '#10B981',
    initial: 'M',
    note: 'Same-day Settlement',
    sub: 'Funds cleared · 0.3s',
    grad: 'from-emerald-500/20',
  },
  {
    name: 'GoTyme',
    color: '#8B5CF6',
    initial: 'G',
    note: '3× Rewards Boost',
    sub: 'Drives repeat purchases',
    grad: 'from-violet-500/20',
  },
];

export default function PaymentEngine() {
  const [active, setActive] = useState(null);

  return (
    <div className="glass rounded-3xl p-6 h-full min-h-[480px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse-glow" />
        <span className="font-mono text-xs tracking-widest text-slate-400 uppercase">
          02 // PH Payment Engine
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold text-white mb-1">Every wallet, one tap</h3>
      <p className="font-body text-sm text-slate-400 mb-6">No more squinting at screenshots. Auto-reconciled.</p>

      <div className="flex-1 flex flex-col gap-3 justify-center">
        {payments.map((p) => (
          <div
            key={p.name}
            onMouseEnter={() => setActive(p.name)}
            onMouseLeave={() => setActive(null)}
            className="relative glass-strong rounded-2xl p-4 cursor-pointer overflow-hidden transition-all hover:scale-[1.02]"
            style={active === p.name ? { borderColor: `${p.color}80` } : undefined}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-r ${p.grad} to-transparent transition-opacity duration-300 ${
                active === p.name ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="relative flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white"
                style={{ background: p.color }}
              >
                {p.initial}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">{p.name}</div>
                <div className="font-mono text-[10px] text-slate-400">{p.sub}</div>
              </div>
              <div
                className={`transition-all duration-300 ${
                  active === p.name ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}
              >
                <span className="text-sm font-bold whitespace-nowrap" style={{ color: p.color }}>
                  {p.note}
                </span>
              </div>
            </div>
            {active === p.name && (
              <div className="absolute top-2 right-2">
                <div className="relative w-1.5 h-1.5">
                  <div className="absolute inset-0 rounded-full" style={{ background: p.color }} />
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: p.color }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}