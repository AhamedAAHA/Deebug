import { useMemo, useState } from 'react';
import DrawingUploader from '../components/upload/DrawingUploader';
import { revisionChanges, revisionCostSummary } from '../data/mockData';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { compareDrawingRevisions } from '../utils/revisionCompare';

function snapshotFromUpload(file, result) {
  return {
    fileName: file?.name || result?.fileName,
    boqItems: result?.boqItems || [],
    quantities: result?.quantities || null,
    extractionAvailable: result?.extractionAvailable === true,
    modelAvailable: result?.modelAvailable === true,
  };
}

export default function RevisionPage() {
  const [v1, setV1] = useState(null);
  const [v2, setV2] = useState(null);

  const comparison = useMemo(() => {
    if (!v1 || !v2) return null;
    return compareDrawingRevisions(v1, v2);
  }, [v1, v2]);

  const showCompare = Boolean(v1 && v2);
  const useLive = comparison?.hasBoq;
  const costSummary = useLive
    ? {
        version1Cost: comparison.version1Cost,
        version2Cost: comparison.version2Cost,
        netChange: comparison.netChange,
        percentChange: comparison.percentChange,
      }
    : revisionCostSummary;
  const changes = useLive ? comparison.changes : revisionChanges;

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Design Revision Intelligence</h1>
        <p className="page-subtitle">Compare drawing versions and detect quantity and cost impacts.</p>
      </header>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Version 1 - Original</h3>
          {v1?.fileName && (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>{v1.fileName}</p>
          )}
          <DrawingUploader
            label="Upload Version 1 Drawing"
            saveAsLatest={false}
            onComplete={(file, result) => setV1(snapshotFromUpload(file, result))}
          />
        </div>
        <div>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Version 2 - Revised</h3>
          {v2?.fileName && (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>{v2.fileName}</p>
          )}
          <DrawingUploader
            label="Upload Version 2 Drawing"
            saveAsLatest={false}
            onComplete={(file, result) => setV2(snapshotFromUpload(file, result))}
          />
        </div>
      </div>

      {showCompare && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {!useLive && (
            <div className="glass-card" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#b45309' }}>
                Upload DWG drawings with extractable geometry on both versions for live BOQ comparison. Showing sample changes below.
              </p>
            </div>
          )}

          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>V1 Cost</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(costSummary.version1Cost)}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>V2 Cost</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                {formatCurrency(costSummary.version2Cost)}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Net Change</div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: costSummary.netChange >= 0 ? '#b91c1c' : '#15803d',
                }}
              >
                {costSummary.netChange >= 0 ? '+' : ''}{formatCurrency(costSummary.netChange)}
              </div>
              <span className={`badge ${costSummary.netChange >= 0 ? 'badge-danger' : 'badge-success'}`} style={{ marginTop: '0.5rem' }}>
                {formatPercent(costSummary.percentChange)}
              </span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Detected Changes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {changes.map((c, i) => (
                <div
                  key={`${c.element}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.055)',
                    border: '1px solid rgba(165,177,210,0.13)',
                    borderRadius: 16,
                    borderLeft: `3px solid ${c.type === 'added' ? '#16a34a' : c.type === 'removed' ? '#dc2626' : '#d97706'}`,
                  }}
                >
                  <span className={`badge badge-${c.type === 'added' ? 'success' : c.type === 'removed' ? 'danger' : 'warning'}`}>
                    {c.type}
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong>{c.element}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{c.detail}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: c.impact < 0 ? '#15803d' : '#b91c1c' }}>
                    {c.impact > 0 ? '+' : ''}{formatCurrency(c.impact)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
