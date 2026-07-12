const STATS = [
  { value: "25K+", label: "Happy guests" },
  { value: "160", label: "Total rooms" },
  { value: "25", label: "Award wins" },
  { value: "200", label: "Team members" },
] as const;

export function MellowStats() {
  return (
    <section className="mellow-stats">
      <div className="mellow-container">
        <div className="mellow-stats-grid">
          {STATS.map((stat) => (
            <div key={stat.label} className="mellow-stat">
              <p className="mellow-stat-value">{stat.value}</p>
              <p className="mellow-stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
