'use client';
import { useEffect, useState } from 'react';
import { adminUrl } from '@/lib/utils';
import Logo from './Logo';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Ecosystem', href: '#features' },
  { label: 'Integration Docs', href: '#docs' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-strong py-3' : 'py-5 bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3 group">
          <Logo variant="dark" className="h-6" />
          <span className="hidden sm:inline font-mono text-[9px] tracking-widest text-[#34D399] border border-[#34D399]/30 rounded-full px-2 py-0.5">
            SaaS
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="font-body text-sm text-slate-300 hover:text-white transition-colors relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A78BFA] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a href={`${adminUrl}/login`} className="hidden sm:flex font-body text-sm text-slate-300 hover:text-white transition-colors px-4 py-2">
            Access Dashboard
          </a>
          <a href={`${adminUrl}/signup`} className="font-body text-sm font-medium text-[#0A0F1D] bg-gradient-to-r from-[#A78BFA] to-[#818CF8] px-5 py-2.5 rounded-lg hover:scale-105 transition-transform glow-purple">
            Start Free Trial
          </a>
        </div>
      </nav>
      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.3), rgba(99, 102, 231, 0.3), transparent)' }} />
      )}
    </header>
  );
}