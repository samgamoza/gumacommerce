'use client';
import { useEffect, useRef } from 'react';

const particles = Array.from({ length: 18 }, (_, i) => ({
  top: `${(i * 37) % 100}%`,
  left: `${(i * 53) % 100}%`,
  delay: `${(i % 6) * 1.2}s`,
  duration: `${5 + (i % 4) * 2}s`,
  size: i % 3 === 0 ? 3 : 2,
}));

export default function Background() {
  const orbsRef = useRef([]);

  useEffect(() => {
    let raf;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 50;
        const y = (e.clientY / window.innerHeight - 0.5) * 50;
        const orbs = orbsRef.current;
        if (orbs[0]) orbs[0].style.transform = `translate(${x}px, ${y}px)`;
        if (orbs[1]) orbs[1].style.transform = `translate(${-x}px, ${-y}px)`;
        if (orbs[2]) orbs[2].style.transform = `translate(${x}px, ${-y}px)`;
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: '#0A0F1D' }}>
      {/* Glow orbs */}
      <div ref={(el) => (orbsRef.current[0] = el)} className="absolute -top-40 -left-40 transition-transform duration-500 ease-out">
        <div className="w-[600px] h-[600px] rounded-full blur-[130px] opacity-30 animate-float" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }} />
      </div>
      <div ref={(el) => (orbsRef.current[1] = el)} className="absolute top-1/3 -right-40 transition-transform duration-700 ease-out">
        <div className="w-[520px] h-[520px] rounded-full blur-[130px] opacity-25 animate-float" style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)', animationDelay: '2.5s' }} />
      </div>
      <div ref={(el) => (orbsRef.current[2] = el)} className="absolute bottom-0 left-1/3 transition-transform duration-500 ease-out">
        <div className="w-[500px] h-[500px] rounded-full blur-[130px] opacity-20 animate-float" style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)', animationDelay: '5s' }} />
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 grid-lines" />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#A78BFA] animate-particle-drift"
          style={{ top: p.top, left: p.left, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration, opacity: 0.4 }}
        />
      ))}

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px animate-scan-down" style={{ background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.5), transparent)' }} />

      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, #0A0F1D 85%)' }} />
    </div>
  );
}