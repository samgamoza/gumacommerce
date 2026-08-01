'use client';
export default function TechFrame({ children, label, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute top-3 left-3 w-3 h-3 border-t border-l border-[#A78BFA]/40 z-20 pointer-events-none" />
      <span className="absolute top-3 right-3 w-3 h-3 border-t border-r border-[#A78BFA]/40 z-20 pointer-events-none" />
      <span className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-[#A78BFA]/40 z-20 pointer-events-none" />
      <span className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-[#A78BFA]/40 z-20 pointer-events-none" />
      {label && (
        <span className="absolute top-3 right-6 font-mono text-[9px] tracking-[0.2em] text-[#A78BFA]/50 z-20 pointer-events-none">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}