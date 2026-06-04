import { sustainabilityData } from '../data/mockData';

export default function SustainabilityPage() {
  const d = sustainabilityData;

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Sustainability Calculator</h1>
        <p className="page-subtitle">Environmental impact analysis and eco-friendly alternatives.</p>
      </header>

      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-card-icon" style={{ margin: '0 auto 0.6rem' }}>CO2</div>
          <div className="stat-card-value">{d.carbonFootprint}</div>
          <div className="stat-card-unit">{d.carbonUnit}</div>
          <div className="stat-card-title">Carbon Footprint</div>
        </div>
        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-card-icon" style={{ margin: '0 auto 0.6rem' }}>WST</div>
          <div className="stat-card-value">{d.materialWastage}%</div>
          <div className="stat-card-title">Material Wastage</div>
        </div>
        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-card-icon" style={{ margin: '0 auto 0.6rem' }}>H2O</div>
          <div className="stat-card-value">{d.waterUsage}</div>
          <div className="stat-card-unit">{d.waterUnit}</div>
          <div className="stat-card-title">Water Usage</div>
        </div>
        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-card-icon" style={{ margin: '0 auto 0.6rem' }}>ECO</div>
          <div className="stat-card-value">{d.score}/100</div>
          <div className="stat-card-title">Sustainability Score</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Impact Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            ['Embodied Carbon', 58, '#7166ee'],
            ['Transport Emissions', 22, '#5b8dff'],
            ['Construction Waste', 12, '#d97706'],
            ['Water Consumption', 8, '#65d8d0'],
          ].map(([label, pct, color]) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                <span>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{pct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Eco-Friendly Alternatives</h3>
        <div className="grid-2">
          {d.alternatives.map((alt) => (
            <div key={alt.current} style={{ padding: '1rem', background: 'rgba(255,255,255,0.055)', borderRadius: 16, border: '1px solid rgba(34,197,94,0.16)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Replace</div>
              <strong>{alt.current}</strong>
              <div style={{ margin: '0.5rem 0', color: 'var(--accent-cyan)' }}>Use {alt.alternative}</div>
              <span className="badge badge-success">{alt.saving}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
