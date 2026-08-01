'use client';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const data = Array.from({ length: 14 }, (_, i) => ({
  v: 40 + Math.sin(i * 0.7) * 20 + i * 6 + Math.cos(i * 0.3) * 8,
}));

const dispatch = [
  { label: 'Lalamove · Dispatching', val: 78, color: '#818CF8' },
  { label: 'Angkas · En route', val: 45, color: '#34D399' },
  { label: 'Move It · Queued', val: 92, color: '#A78BFA' },
];

export default function MerchantDashboard() {
  return (
    <div className="glass rounded-3xl p-6 h-full min-h-[480px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse-glow" />
        <span className="font-mono text-xs tracking-widest text-slate-400 uppercase">
          04 // Merchant Admin Dashboard
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold text-white mb-1">Live store analytics</h3>
      <p className="font-body text-sm text-slate-400 mb-6">Real-time revenue, orders, and dispatch.</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass rounded-xl p-4">
          <div className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">Gross Revenue</div>
          <div className="font-display text-xl md:text-2xl font-bold text-white mt-1">₱847K</div>
          <div className="font-mono text-[10px] text-[#34D399]">↑ 23.4%</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">Order Volume</div>
          <div className="font-display text-xl md:text-2xl font-bold text-white mt-1">1,294</div>
          <div className="font-mono text-[10px] text-[#34D399]">↑ 12.1%</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">Active Stores</div>
          <div className="font-display text-xl md:text-2xl font-bold text-white mt-1">47</div>
          <div className="font-mono text-[10px] text-[#A78BFA]">↑ 3 today</div>
        </div>
      </div>

      <div className="glass rounded-xl p-4 mb-4 flex-1 min-h-[120px]">
        <div className="font-mono text-[9px] text-slate-400 uppercase tracking-wider mb-2">Revenue Flow · 12h</div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="#A78BFA" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {dispatch.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between mb-1">
              <span className="font-mono text-[10px] text-slate-400">{d.label}</span>
              <span className="font-mono text-[10px] text-white">{d.val}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${d.val}%`, background: d.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}