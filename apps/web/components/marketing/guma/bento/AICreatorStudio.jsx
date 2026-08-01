'use client';
import { useState } from 'react';
import { Sparkles, Mic, Volume2 } from 'lucide-react';

const captions = [
  '☕ Wake up to pure Barako energy. Single-origin drip bags — brewed in 30s, savored for hours. Limited drop today only. Tap to order 👆 #KapePilipinas #GumaStore',
  '🔥 Your morning ritual, upgraded. Artisan Barako drip bags — no machine, no waiting, just pure Filipino coffee heritage in every cup. Stock running low. Order now.',
  '✨ From Batangas farms to your cup in 30 seconds. Single-origin Barako that hits different. This drop won\u2019t restock. Secure yours → link in bio. #SupportLocal',
];

export default function AICreatorStudio() {
  const [generating, setGenerating] = useState(false);
  const [caption, setCaption] = useState('');
  const [idx, setIdx] = useState(0);

  const generate = () => {
    if (generating) return;
    setGenerating(true);
    setCaption('');
    const target = captions[idx % captions.length];
    let i = 0;
    const interval = setInterval(() => {
      if (i <= target.length) {
        setCaption(target.slice(0, i));
        i += 3;
      } else {
        clearInterval(interval);
        setGenerating(false);
        setIdx((p) => p + 1);
      }
    }, 18);
  };

  return (
    <div className="glass rounded-3xl p-6 h-full min-h-[400px]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse-glow" />
        <span className="font-mono text-xs tracking-widest text-slate-400 uppercase">
          05 // AI Creator Studio &amp; Voice Labs
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-white mb-1">Gemini-powered viral copy</h3>
          <p className="font-body text-sm text-slate-400 mb-4">Generate scroll-stopping captions.</p>
          <div className="glass-strong rounded-xl p-4 min-h-[160px] mb-4">
            {caption ? (
              <p className="text-sm text-slate-200 leading-relaxed font-body">
                {caption}
                <span className="animate-pulse text-[#A78BFA]">▊</span>
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Click generate to create a viral caption for your product...
              </p>
            )}
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#6366F1] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-50 glow-purple"
          >
            <Sparkles className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Viral Caption'}
          </button>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-white mb-1">Voice Assistant</h3>
          <p className="font-body text-sm text-slate-400 mb-4">Low-latency voice commerce.</p>
          <div className="glass-strong rounded-xl p-6 min-h-[160px] mb-4 flex flex-col items-center justify-center">
            <button className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#6366F1] flex items-center justify-center hover:scale-105 transition-transform">
              <Mic className="w-6 h-6 text-white" />
              <div className="absolute inset-0 rounded-full bg-[#A78BFA] animate-ping opacity-20" />
            </button>
            <div className="flex items-center gap-1 mt-4 h-8">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-[#A78BFA] animate-wave"
                  style={{
                    height: `${(20 + Math.sin(i * 0.5) * 15 + Math.cos(i * 0.3) * 8).toFixed(2)}px`,
                    animationDuration: `${0.6 + (i % 3) * 0.2}s`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
            <p className="font-mono text-[10px] text-slate-400 mt-3">&ldquo;Magkano ang Barako drip bags?&rdquo;</p>
          </div>
          <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#34D399] flex-shrink-0" />
            <span className="text-xs text-slate-300">&ldquo;₱450 po, kasama ang delivery via Lalamove.&rdquo;</span>
          </div>
        </div>
      </div>
    </div>
  );
}