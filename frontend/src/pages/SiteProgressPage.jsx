import { useState, useRef } from 'react';
import { delay } from '../utils/formatters';

const mockResult = {
  workCompleted: 34,
  quantityCompleted: '116.5 m3 concrete, 16,490 bricks',
  quantityRemaining: '226 m3 concrete, 32,010 bricks',
  paymentRecommendation: 'Release 28% milestone payment - align with 34% physical progress',
  items: [
    { task: 'Foundation RCC', planned: 100, actual: 100 },
    { task: 'Ground Floor Masonry', planned: 80, actual: 62 },
    { task: 'First Floor Slab', planned: 45, actual: 12 },
    { task: 'Plumbing Rough-in', planned: 30, actual: 8 },
  ],
};

export default function SiteProgressPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const analyze = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setResult(null);
    await delay(2500);
    setAnalyzing(false);
    setResult(mockResult);
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Site Progress Verification</h1>
        <p className="page-subtitle">Upload site photos for AI-powered progress analysis.</p>
      </header>

      <div className="grid-2">
        <div
          className="upload-zone glass-card"
          style={{ padding: '2rem', cursor: 'pointer' }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); analyze(e.dataTransfer.files[0]); }}
        >
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => analyze(e.target.files[0])} />
          <div className="upload-zone-icon">IMG</div>
          <h3>Upload Site Photo</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>JPG or PNG construction progress images.</p>
          {analyzing && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="progress-bar"><div className="progress-bar-fill" style={{ width: '70%' }} /></div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>AI analyzing site conditions...</p>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '1rem', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {preview ? (
            <img src={preview} alt="Site" style={{ maxHeight: 260, borderRadius: 18, objectFit: 'cover' }} />
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Photo preview will appear here</span>
          )}
        </div>
      </div>

      {result && (
        <div style={{ marginTop: '1.5rem', animation: 'fadeIn 0.5s ease' }}>
          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{result.workCompleted}%</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Work Completed</div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Quantity Completed</div>
              <div style={{ fontSize: '0.85rem' }}>{result.quantityCompleted}</div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Quantity Remaining</div>
              <div style={{ fontSize: '0.85rem' }}>{result.quantityRemaining}</div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(123,112,239,0.22)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Payment Recommendation</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>{result.paymentRecommendation}</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Task Progress</h3>
            {result.items.map((item) => (
              <div key={item.task} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  <span>{item.task}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{item.actual}% / {item.planned}% planned</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-bar-fill" style={{ width: `${item.actual}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
