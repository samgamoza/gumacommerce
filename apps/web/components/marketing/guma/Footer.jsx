'use client';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/50 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo variant="dark" className="h-5" />
        </div>
        <p className="font-mono text-xs text-slate-500 text-center">
          © 2026 Guma One.Ai · The Neural Backbone of PH Commerce
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors font-body">Privacy</a>
          <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors font-body">Terms</a>
          <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors font-body">Pricing</a>
        </div>
      </div>
    </footer>
  );
}