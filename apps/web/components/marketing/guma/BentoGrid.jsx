'use client';
import Reveal from './Reveal';
import TiltCard from './TiltCard';
import TechFrame from './TechFrame';
import SocialAutoFeeder from './bento/SocialAutoFeeder';
import PaymentEngine from './bento/PaymentEngine';
import DeliveryRouting from './bento/DeliveryRouting';
import MerchantDashboard from './bento/MerchantDashboard';
import AICreatorStudio from './bento/AICreatorStudio';

const cards = [
  { num: '01', component: <SocialAutoFeeder />, span: 'md:col-span-2', delay: 0.1 },
  { num: '02', component: <PaymentEngine />, span: '', delay: 0.2 },
  { num: '03', component: <DeliveryRouting />, span: '', delay: 0.3 },
  { num: '04', component: <MerchantDashboard />, span: 'md:col-span-2', delay: 0.4 },
  { num: '05', component: <AICreatorStudio />, span: 'md:col-span-3', delay: 0.5 },
];

export default function BentoGrid() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-32">
      <Reveal className="text-center mb-16">
        <span className="font-mono text-xs tracking-[0.2em] text-[#A78BFA] uppercase">
          // The Frictionless Ecosystem
        </span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4 tracking-tight">
          One platform. <span className="text-gradient-purple">Zero friction.</span>
        </h2>
        <p className="font-body text-slate-400 mt-4 max-w-2xl mx-auto text-lg">
          Every pillar of Philippine social commerce, automated and unified into a single kinetic interface.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((c) => (
          <Reveal key={c.num} className={`${c.span} h-full`} delay={c.delay}>
            <TiltCard className="h-full">
              <TechFrame label={`${c.num} //`}>
                {c.component}
              </TechFrame>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}