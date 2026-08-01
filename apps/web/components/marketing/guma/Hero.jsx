'use client';
import Reveal from './Reveal';
import CountUp from './CountUp';
import MagneticButton from './MagneticButton';

const stats = [
  { icon: '⚡', value: 1.2, decimals: 1, suffix: 's', label: 'Average Checkout' },
  { icon: '₱', value: 80, decimals: 0, suffix: 'M+', label: 'Transactions Settled' },
  { icon: '◆', value: 99.9, decimals: 1, suffix: '%', label: 'SSL Uptime' },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
      {/* Rotating HUD rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full border border-[#A78BFA]/[0.06] animate-spin-slow" style={{ animationDuration: '40s' }} />
        <div className="absolute w-[700px] h-[700px] rounded-full border border-[#6366F1]/[0.05] animate-spin-slow" style={{ animationDuration: '60s', animationDirection: 'reverse' }} />
        <div className="absolute w-[350px] h-[350px] rounded-full border border-[#34D399]/[0.06] animate-spin-slow" style={{ animationDuration: '25s' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full border-t border-[#A78BFA]/20 animate-spin-slow" style={{ animationDuration: '15s', clipPath: 'polygon(50% 0, 55% 5%, 50% 10%, 45% 5%)' }} />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* HUD status bar */}
        <Reveal>
          <div className="flex items-center justify-center gap-3 mb-6 font-mono text-[10px] text-slate-500 tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
              SYS.ONLINE
            </span>
            <span className="text-slate-700">·</span>
            <span>LAT 14.5995°N</span>
            <span className="text-slate-700">·</span>
            <span>LON 120.9842°E</span>
          </div>
        </Reveal>

        <Reveal>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse-glow" />
            <span className="font-mono text-xs tracking-widest text-slate-300 uppercase">
              Philippine Social Commerce Engine
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-[-0.04em] leading-[1.02]">
            No More <span className="text-gradient-purple">&lsquo;HM&rsquo;</span> or{' '}
            <span className="text-gradient-purple">&lsquo;PM Sent.&rsquo;</span>
            <br />
            Auto-verify GCash &amp; Maya in 1-Click.
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="font-body text-slate-300 text-lg md:text-xl mt-8 max-w-3xl mx-auto leading-relaxed">
            Transform your Facebook, Instagram, or TikTok comments into instant, paid orders. Guma One.Ai auto-generates
            secure checkout links, validates GCash &amp; Maya payments in real time, and pre-books riders (Lalamove,
            Angkas, Grab) — before you even finish packing the order.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <MagneticButton className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#6366F1] text-white font-semibold text-base glow-purple">
              Launch Your Auto-Store
            </MagneticButton>
            <MagneticButton className="w-full sm:w-auto px-8 py-4 rounded-xl glass text-white font-medium text-base hover:bg-slate-700/40">
              ▶ Watch 10-Second Demo
            </MagneticButton>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mt-16">
            {stats.map((s) => (
              <div key={s.label} className="text-center relative">
                <div className="font-mono text-2xl md:text-3xl font-bold text-white">
                  <span className="text-[#A78BFA]">{s.icon}</span>{' '}
                  <CountUp end={s.value} decimals={s.decimals} suffix={s.suffix} />
                </div>
                <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}