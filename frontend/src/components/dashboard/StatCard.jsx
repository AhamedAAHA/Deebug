import '../../styles/components.css';

export default function StatCard({ title, value, unit, icon, trend, variant = 'default' }) {
  return (
    <div className={`stat-card glass-card stat-card--${variant}`}>
      <div className="stat-card-header">
        <span className="stat-card-icon">{icon}</span>
        {trend && <span className={`stat-trend stat-trend--${trend.type}`}>{trend.label}</span>}
      </div>
      <div className="stat-card-value">
        {value}
        {unit && <span className="stat-card-unit">{unit}</span>}
      </div>
      <div className="stat-card-title">{title}</div>
    </div>
  );
}
