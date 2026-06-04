import { useState, useMemo } from 'react';
import { materialPrices, costPrediction, quantityCalculations } from '../data/mockData';
import { formatCurrency } from '../utils/formatters';
import { recalculateMaterialCost } from '../utils/calculations';

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.72rem',
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(165,177,210,0.13)',
  borderRadius: 14,
};

export default function CostEstimationPage() {
  const [prices, setPrices] = useState(materialPrices);
  const materialTotal = useMemo(() => recalculateMaterialCost(prices), [prices]);
  const inflationImpact = materialTotal * 0.08;
  const expectedFinal = materialTotal + inflationImpact;

  const updateRate = (id, rate) => {
    setPrices((prev) => prev.map((p) => (p.id === id ? { ...p, rate: Number(rate) || 0 } : p)));
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Cost Estimation</h1>
        <p className="page-subtitle">LKR material rates with instant cost recalculation.</p>
      </header>

      <div className="prediction-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="prediction-card glass-card">
          <div className="prediction-card-label">Current Estimate</div>
          <div className="prediction-card-value">{formatCurrency(materialTotal)}</div>
        </div>
        <div className="prediction-card glass-card">
          <div className="prediction-card-label">Inflation Impact (+8%)</div>
          <div className="prediction-card-value" style={{ color: '#b45309' }}>+{formatCurrency(inflationImpact)}</div>
        </div>
        <div className="prediction-card glass-card">
          <div className="prediction-card-label">Expected Final Cost</div>
          <div className="prediction-card-value" style={{ color: 'var(--accent-cyan)' }}>{formatCurrency(expectedFinal)}</div>
        </div>
        <div className="prediction-card glass-card">
          <div className="prediction-card-label">Risk Level</div>
          <div className="prediction-card-value"><span className="badge badge-warning">{costPrediction.riskLevel}</span></div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{costPrediction.confidence}% confidence</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Editable Material Rates</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Unit</th>
                <th>Usage</th>
                <th>Rate (LKR)</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.unit}</td>
                  <td>{m.usage.toLocaleString('en-LK')}</td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      value={m.rate}
                      onChange={(e) => updateRate(m.id, e.target.value)}
                      style={{ width: 100, padding: '0.35rem 0.5rem' }}
                    />
                  </td>
                  <td className="amount-cell">{formatCurrency(m.rate * m.usage)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Material Subtotal</td>
                <td className="amount-cell" style={{ fontWeight: 700 }}>{formatCurrency(materialTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>AI Quantity Calculation</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              ['Wall Area', `${quantityCalculations.wallArea} m2`],
              ['Floor Area', `${quantityCalculations.floorArea} m2`],
              ['Concrete Volume', `${quantityCalculations.concreteVolume} m3`],
              ['Brick Quantity', quantityCalculations.brickQuantity.toLocaleString('en-LK')],
              ['Paint Quantity', `${quantityCalculations.paintQuantity} L`],
              ['Tile Quantity', `${quantityCalculations.tileQuantity} m2`],
              ['Steel Quantity', `${quantityCalculations.steelQuantity} MT`],
            ].map(([label, val]) => (
              <div key={label} style={rowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
