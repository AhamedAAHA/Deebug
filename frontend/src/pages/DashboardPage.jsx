import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import { CostPieChart, MaterialBarChart, ProgressLineChart } from '../components/dashboard/DashboardCharts';
import { projectSummary as mockSummary } from '../data/mockData';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { fetchProjectSummary } from '../utils/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState(mockSummary);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchProjectSummary();
      if (!cancelled && data) {
        setSummary({
          totalCost: data.totalCost ?? mockSummary.totalCost,
          concreteVolume: data.concreteVolume ?? mockSummary.concreteVolume,
          steelWeight: data.steelWeight ?? mockSummary.steelWeight,
          brickQuantity: data.brickQuantity ?? mockSummary.brickQuantity,
          boqItemCount: data.boqItemCount ?? mockSummary.boqItemCount,
          sustainabilityScore: data.sustainabilityScore ?? mockSummary.sustainabilityScore,
          riskLevel: data.riskLevel ?? mockSummary.riskLevel,
          progress: data.progress ?? mockSummary.progress,
        });
        setLive(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const s = summary;

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Project Dashboard</h1>
        <p className="page-subtitle">
          Skyline Residency Block A — {live ? 'synced from server' : 'sample overview'}
        </p>
      </header>

      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard title="Total Project Cost" value={formatCurrency(s.totalCost)} icon="Cost" trend={{ type: 'up', label: '+14.6%' }} />
        <StatCard title="Concrete Volume" value={formatNumber(s.concreteVolume, 1)} unit="m3" icon="M3" />
        <StatCard title="Steel Weight" value={formatNumber(s.steelWeight, 1)} unit="MT" icon="ST" />
        <StatCard title="Brick Quantity" value={formatNumber(s.brickQuantity)} unit="Nos" icon="BQ" />
      </div>

      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard title="BOQ Items" value={s.boqItemCount} icon="BOQ" variant="info" />
        <StatCard title="Sustainability Score" value={`${s.sustainabilityScore}/100`} icon="ECO" variant="success" />
        <StatCard title="Project Risk" value={s.riskLevel} icon="RISK" variant="warning" />
        <StatCard title="Site Progress" value={`${s.progress}%`} icon="SITE" trend={{ type: 'up', label: 'On track' }} />
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <CostPieChart />
        <MaterialBarChart />
      </div>

      <ProgressLineChart />

      <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/upload" className="btn btn-primary btn-sm">Upload Drawing</Link>
          <Link to="/boq" className="btn btn-ghost btn-sm">View BOQ</Link>
          <Link to="/visualization" className="btn btn-ghost btn-sm">3D Model</Link>
          <Link to="/cost" className="btn btn-ghost btn-sm">Cost Estimate</Link>
        </div>
      </div>
    </div>
  );
}
