'use client';
import Reveal from './Reveal';
import { X, Check } from 'lucide-react';

const beforeItems = [
  'Answering "HM?" 50 times a day in Messenger',
  'Squinting at crop-edited GCash screenshots to spot fakes',
  'Copy-pasting customer addresses into the Lalamove app',
  'Manually confirming bank transfers past midnight',
  'Losing orders because your reply was too slow',
];

const afterItems = [
  'AI auto-replies to comments with a direct checkout link',
  'Customer pays via GCash, Maya, or GoTyme — validated instantly',
  'Shipping coordinates auto-pushed directly to riders',
  'Fake receipts flagged automatically by the reconciliation engine',
  'Customer gets SMS/Viber tracking link in seconds',
];

export default function BeforeAfter() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <Reveal className="text-center mb-16">
        <span className="font-mono text-xs tracking-[0.2em] text-[#A78BFA] uppercase">
          // The Anti-PM-Sent Campaign
        </span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4 tracking-tight">
          From manual chaos to <span className="text-gradient-purple">zero-touch commerce</span>
        </h2>
        <p className="font-body text-slate-400 mt-4 max-w-2xl mx-auto text-lg">
          Social media buying in the Philippines is notoriously friction-filled. Here's how Guma One.Ai kills the manual loop.
        </p>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Before */}
        <Reveal>
          <div className="glass rounded-3xl p-8 h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/40 to-orange-500/40" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="font-mono text-[10px] text-red-400/60 tracking-widest uppercase">BEFORE</div>
                <h3 className="font-display text-lg font-bold text-white">The Manual Chaos</h3>
              </div>
            </div>
            <div className="space-y-4">
              {beforeItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <X className="w-4 h-4 text-red-400/50 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-400 font-body">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* After */}
        <Reveal delay={0.1}>
          <div className="glass-strong rounded-3xl p-8 h-full relative overflow-hidden border border-[#34D399]/20">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#34D399] to-[#10B981]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#34D399]/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-[#34D399]" />
              </div>
              <div>
                <div className="font-mono text-[10px] text-[#34D399]/60 tracking-widest uppercase">AFTER</div>
                <h3 className="font-display text-lg font-bold text-white">The Guma One Way</h3>
              </div>
            </div>
            <div className="space-y-4">
              {afterItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#34D399] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300 font-body">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}