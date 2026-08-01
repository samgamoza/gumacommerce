'use client';
import { useState, useEffect, useRef } from 'react';

const cities = {
  Manila: { Lalamove: 85, Angkas: 65, 'Move It': 70 },
  'Quezon City': { Lalamove: 95, Angkas: 75, 'Move It': 80 },
  Makati: { Lalamove: 70, Angkas: 55, 'Move It': 60 },
};

const services = ['Lalamove', 'Angkas', 'Move It'];

export default function DeliveryRouting() {
  const [city, setCity] = useState('Manila');
  const [calculating, setCalculating] = useState(false);
  const [logs, setLogs] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    setCalculating(true);
    setLogs([]);
    const steps = [
      '> Initializing dispatch router...',
      `> Geo-locating ${city}...`,
      '> Pinging Lalamove API...',
      '> Syncing Angkas rider network...',
      '> Querying Move It rates...',
      '> ETA calculated. Fees locked.',
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setLogs((prev) => [...prev, steps[i]]);
        if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
        i++;
      } else {
        clearInterval(interval);
        setCalculating(false);
      }
    }, 220);
    return () => clearInterval(interval);
  }, [city]);

  return (
    <div className="glass rounded-3xl p-6 h-full min-h-[480px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#818CF8] animate-pulse-glow" />
        <span className="font-mono text-xs tracking-widest text-slate-400 uppercase">
          03 // Instant Delivery Routing
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold text-white mb-1">Zero-Touch Fulfillment</h3>
      <p className="font-body text-sm text-slate-400 mb-6">Payment clears → rider auto-booked. Customer gets SMS/Viber tracking.</p>

      <div className="flex gap-2 mb-4">
        {Object.keys(cities).map((c) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              city === c ? 'bg-[#818CF8] text-[#0A0F1D]' : 'glass text-slate-400 hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div
        ref={boxRef}
        className="glass-strong rounded-xl p-3 mb-4 h-24 overflow-hidden font-mono text-[10px] text-[#34D399] leading-relaxed"
      >
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
        {calculating && <span className="animate-pulse">▊</span>}
      </div>

      <div className="space-y-2 mt-auto">
        {services.map((s) => (
          <div key={s} className="flex items-center justify-between glass rounded-lg px-4 py-2.5">
            <span className="text-xs text-slate-300">{s}</span>
            <span className="font-mono text-sm font-bold text-white">
              {calculating ? '...' : `₱${cities[city][s]}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}