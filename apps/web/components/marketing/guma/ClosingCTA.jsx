'use client';
import { useState } from 'react';
import { Terminal } from 'lucide-react';
import Reveal from './Reveal';

export default function ClosingCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <section id="docs" className="max-w-5xl mx-auto px-6 py-32">
      <Reveal>
        <div className="relative glass-strong rounded-[2rem] p-12 md:p-16 text-center overflow-hidden">
          {/* Corner brackets */}
          <span className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#A78BFA]/50 pointer-events-none" />
          <span className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#A78BFA]/50 pointer-events-none" />
          <span className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#A78BFA]/50 pointer-events-none" />
          <span className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#A78BFA]/50 pointer-events-none" />

          {/* Glow */}
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[100px] opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #A78BFA, transparent 70%)' }}
          />
          {/* Scan line */}
          <div className="absolute left-0 right-0 h-px animate-scan-down pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.4), transparent)', animationDuration: '6s' }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] text-[#34D399] tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
              AWAITING_INPUT
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tight max-w-2xl mx-auto leading-tight">
              Ready to scale your Philippine storefront?
            </h2>
            <p className="font-body text-slate-400 mt-4 text-lg max-w-xl mx-auto">
              Join thousands of high-growth digital merchants using Guma One.Ai.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (valid) setSubmitted(true);
              }}
              className="mt-8 max-w-md mx-auto"
            >
              <div className="flex items-center gap-2 glass rounded-xl p-2 pl-5 border-b-2 border-slate-700">
                <span className="font-mono text-[#34D399] text-sm">{'>'}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@email.com"
                  className="flex-1 bg-transparent text-white text-sm outline-none font-mono placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={!valid}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    valid
                      ? 'bg-gradient-to-r from-[#A78BFA] to-[#818CF8] text-white glow-purple hover:scale-105'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Terminal className="w-4 h-4" /> Get Started
                </button>
              </div>
              {submitted && (
                <p className="mt-4 text-[#34D399] font-mono text-sm">
                  ✓ Welcome aboard. Check your inbox for onboarding.
                </p>
              )}
            </form>
          </div>
        </div>
      </Reveal>
    </section>
  );
}