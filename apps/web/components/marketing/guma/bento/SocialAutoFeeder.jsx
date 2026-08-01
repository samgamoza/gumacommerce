'use client';
import { useState } from 'react';
import { ShoppingBag, Check, X, Zap } from 'lucide-react';

export default function SocialAutoFeeder() {
  const [stage, setStage] = useState('feed');

  return (
    <div className="glass rounded-3xl p-6 h-full min-h-[480px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse-glow" />
        <span className="font-mono text-xs tracking-widest text-slate-400 uppercase">
          01 // Social Auto-Feeder
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold text-white mb-1">Turn posts into checkouts</h3>
      <p className="font-body text-sm text-slate-400 mb-6">Tap Buy Now. Watch the friction vanish.</p>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-64 h-[380px] rounded-[2.5rem] glass-strong p-3 border-2 border-slate-700/50">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0A0F1D] rounded-full z-20" />

          {stage === 'feed' && (
            <div className="h-full rounded-[2rem] overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 p-3 pt-8">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#6366F1]" />
                <div>
                  <div className="text-xs font-semibold text-white">@kape.pilipinas</div>
                  <div className="text-[10px] text-slate-500">Sponsored</div>
                </div>
              </div>
              <div className="flex-1 mx-3 rounded-xl bg-gradient-to-br from-amber-900/40 to-[#1E293B] flex items-center justify-center text-4xl">
                ☕
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-300 mb-3">Single-origin Barako drip bags. Limited drop! 🔥</p>
                <button
                  onClick={() => setStage('checkout')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#818CF8] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform glow-purple"
                >
                  <ShoppingBag className="w-4 h-4" /> Buy Now — ₱450
                </button>
              </div>
            </div>
          )}

          {stage === 'checkout' && (
            <div className="h-full rounded-[2rem] flex flex-col p-4 pt-10 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-white">Checkout</span>
                <button onClick={() => setStage('feed')}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="glass rounded-xl p-3 mb-3">
                <div className="text-xs text-slate-400">Barako Drip Bags ×1</div>
                <div className="text-lg font-bold text-white">₱450</div>
              </div>
              <div className="glass rounded-xl p-3 mb-3 flex items-center gap-2 border border-[#10B981]/30">
                <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center text-xs font-bold text-[#34D399]">
                  G
                </div>
                <span className="text-xs text-white">GCash •••• 4823</span>
                <Check className="w-3 h-3 text-[#34D399] ml-auto" />
              </div>
              <button
                onClick={() => setStage('success')}
                className="mt-auto py-3 rounded-xl bg-[#10B981] text-[#0A0F1D] text-sm font-bold hover:scale-[1.02] transition-transform"
              >
                Complete Payment
              </button>
            </div>
          )}

          {stage === 'success' && (
            <div className="h-full rounded-[2rem] flex flex-col items-center justify-center gap-4 p-4 animate-slide-up">
              <div className="w-16 h-16 rounded-full bg-[#34D399]/20 flex items-center justify-center animate-pulse-glow">
                <Check className="w-8 h-8 text-[#34D399]" />
              </div>
              <div className="text-center">
                <div className="font-display text-lg font-bold text-white">Order Confirmed!</div>
                <div className="text-xs text-slate-400 mt-1">Rider dispatching via Lalamove...</div>
              </div>
              <div className="flex items-center gap-1 text-[#34D399]">
                <Zap className="w-3 h-3" />
                <span className="font-mono text-xs">1.2s checkout</span>
              </div>
              <button onClick={() => setStage('feed')} className="text-xs text-slate-500 mt-2 hover:text-slate-300">
                Reset demo →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}