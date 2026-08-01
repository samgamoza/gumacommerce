'use client';
import { useRef } from 'react';

export default function MagneticButton({ children, className = '', ...props }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
  };

  const handleLeave = () => {
    const btn = ref.current;
    if (!btn) return;
    btn.style.transform = 'translate(0, 0)';
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}