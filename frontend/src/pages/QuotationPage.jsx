import { useState, useMemo } from 'react';
import { analyzeContractors } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

const defaultQuotes = [
  { id: 1, name: 'BuildPro Contractors', price: 2750000, deliveryDays: 180, qualityScore: 88, riskScore: 22 },
  { id: 2, name: 'Skyline Constructions', price: 2847500, deliveryDays: 165, qualityScore: 92, riskScore: 18 },
  { id: 3, name: 'Metro Build Solutions', price: 2680000, deliveryDays: 195, qualityScore: 78, riskScore: 35 },
];

export default function QuotationPage() {
  const [quotes, setQuotes] = useState(defaultQuotes);
  const ranked = useMemo(() => analyzeContractors(quotes), [quotes]);
  const recommended = ranked?.[0];

  const updateQuote = (id, field, value) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: Number(value) || 0 } : q)));
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Contractor Quotation Analyzer</h1>
        <p className="page-subtitle">Compare quotes by price, delivery, quality, and risk.</p>
      </header>

      {recommended && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderColor: 'rgba(34, 197, 94, 0.24)' }}>
          <span className="badge badge-success">Recommended</span>
          <h3 style={{ margin: '0.5rem 0' }}>{recommended.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Best overall score: {recommended.totalScore}/100 - balanced price, quality, and low risk profile.
          </p>
        </div>
      )}

      <div className="grid-3">
        {quotes.map((q) => {
          const score = ranked?.find((r) => r.id === q.id);
          const isRec = recommended?.id === q.id;
          return (
            <div key={q.id} className={`glass-card ${isRec ? 'recommended-card' : ''}`} style={{ padding: '1.25rem', border: isRec ? '1px solid rgba(34,197,94,0.24)' : undefined }}>
              {isRec && <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>Top Pick</span>}
              <h3 style={{ marginBottom: '1rem' }}>{q.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="label">Price (LKR)</label>
                  <input className="input" type="number" value={q.price} onChange={(e) => updateQuote(q.id, 'price', e.target.value)} />
                </div>
                <div>
                  <label className="label">Delivery (days)</label>
                  <input className="input" type="number" value={q.deliveryDays} onChange={(e) => updateQuote(q.id, 'deliveryDays', e.target.value)} />
                </div>
                <div>
                  <label className="label">Quality Score (0-100)</label>
                  <input className="input" type="number" value={q.qualityScore} onChange={(e) => updateQuote(q.id, 'qualityScore', e.target.value)} />
                </div>
                <div>
                  <label className="label">Risk Score (0-100)</label>
                  <input className="input" type="number" value={q.riskScore} onChange={(e) => updateQuote(q.id, 'riskScore', e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Score</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{score?.totalScore}/100</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatCurrency(q.price)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Comparison Matrix</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Contractor</th>
              <th>Price</th>
              <th>Delivery</th>
              <th>Quality</th>
              <th>Risk</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {ranked?.map((q) => (
              <tr key={q.id}>
                <td>{q.name} {q.id === recommended?.id && '(top)'}</td>
                <td>{formatCurrency(q.price)}</td>
                <td>{q.deliveryDays} days</td>
                <td>{q.qualityScore}</td>
                <td><span className={`badge ${q.riskScore > 30 ? 'badge-danger' : 'badge-success'}`}>{q.riskScore}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{q.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
