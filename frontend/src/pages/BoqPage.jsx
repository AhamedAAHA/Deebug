import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BoqTable from '../components/boq/BoqTable';
import { boqItems as mockBoqItems } from '../data/mockData';
import { formatCompactCurrency } from '../utils/formatters';
import { exportBoqExcel, exportBoqPdf } from '../utils/boqExporters';
import { getLatestDrawing, patchLatestDrawing } from '../utils/drawingSession';
import { extractBoqFromCad } from '../utils/boqExtraction';
import { fetchBoqItems, syncBoqToServer } from '../utils/api';

const FINISH_CATEGORIES = ['Plaster', 'Flooring', 'Painting'];

function countCategory(items, cat) {
  return items.filter(
    (x) =>
      x.category.toLowerCase().includes(cat.toLowerCase())
      || (cat === 'Finishes' && FINISH_CATEGORIES.includes(x.category)),
  ).length;
}

function sumCategory(items, cat) {
  return items
    .filter((x) =>
      cat === 'Finishes'
        ? FINISH_CATEGORIES.includes(x.category)
        : x.category.toLowerCase().includes(cat.toLowerCase()),
    )
    .reduce((s, x) => s + x.amount, 0);
}

export default function BoqPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q')?.trim().toLowerCase() || '';
  const [drawing, setDrawing] = useState(null);
  const [serverItems, setServerItems] = useState(null);
  const [exportMsg, setExportMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, items] = await Promise.all([getLatestDrawing(), fetchBoqItems()]);
      if (!cancelled) {
        if (stored) setDrawing(stored);
        if (items?.length) setServerItems(items);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const hasExtractedBoq = drawing?.extractionAvailable === true && Array.isArray(drawing.boqItems);
  const baseItems = hasExtractedBoq
    ? drawing.boqItems
    : drawing
      ? []
      : serverItems?.length
        ? serverItems
        : mockBoqItems;

  const items = useMemo(() => {
    if (!searchQuery) return baseItems;
    return baseItems.filter(
      (item) =>
        item.category?.toLowerCase().includes(searchQuery)
        || item.description?.toLowerCase().includes(searchQuery),
    );
  }, [baseItems, searchQuery]);

  const canGenerateFromCad = drawing?.modelAvailable && Array.isArray(drawing.buildingElements) && !hasExtractedBoq;

  const handleGenerateBoq = async () => {
    const extracted = extractBoqFromCad(
      {
        modelAvailable: drawing.modelAvailable,
        buildingElements: drawing.buildingElements,
        drawingBounds: drawing.drawingBounds,
      },
      drawing.fileName,
    );
    if (!extracted.extractionAvailable) return;
    const updated = await patchLatestDrawing(extracted);
    setDrawing(updated);
    await syncBoqToServer({
      items: extracted.boqItems,
      quantities: extracted.quantities,
      fileName: drawing.fileName,
    });
    const fresh = await fetchBoqItems();
    if (fresh?.length) setServerItems(fresh);
  };

  const handleExport = async (type) => {
    try {
      if (type === 'PDF') {
        await exportBoqPdf(items, drawing);
      } else {
        exportBoqExcel(items, drawing);
      }
      setExportMsg(`${type} export downloaded successfully.`);
    } catch {
      setExportMsg(`${type} export failed. Please try again.`);
    }
    setTimeout(() => setExportMsg(''), 3000);
  };

  return (
    <div className="page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Smart BOQ Generator</h1>
          <p className="page-subtitle">Bill of Quantities - auto-generated from drawing analysis.</p>
          <p style={{ marginTop: '0.45rem', color: drawing ? 'var(--accent-cyan)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
            Source drawing: {drawing?.fileName || 'No drawing uploaded yet'}
          </p>
          {searchQuery && (
            <p style={{ marginTop: '0.25rem', color: 'var(--accent-cyan)', fontSize: '0.78rem' }}>
              Filtered by &quot;{searchParams.get('q')}&quot; — {items.length} match{items.length === 1 ? '' : 'es'}
            </p>
          )}
          <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            {hasExtractedBoq
              ? 'Showing BOQ extracted from the latest uploaded drawing.'
              : drawing
                ? 'Waiting for CAD extraction before BOQ rows can be displayed.'
                : serverItems?.length
                  ? 'Showing BOQ synced from the server.'
                  : 'Showing sample BOQ data until a drawing is uploaded.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!items.length} onClick={() => handleExport('PDF')}>Export PDF</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!items.length} onClick={() => handleExport('Excel')}>Export Excel</button>
        </div>
      </header>

      {exportMsg && (
        <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>
          {exportMsg}
        </div>
      )}

      {drawing && !hasExtractedBoq && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderColor: 'rgba(245, 158, 11, 0.24)' }}>
          <h3 style={{ color: '#b45309', marginBottom: '0.5rem' }}>
            {canGenerateFromCad ? 'Generate BOQ from CAD' : 'BOQ extraction unavailable'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: canGenerateFromCad ? '1rem' : 0 }}>
            {canGenerateFromCad
              ? `${drawing.fileName} was parsed for 3D preview. Generate a Bill of Quantities from the detected CAD geometry.`
              : `${drawing.fileName} was uploaded, but no drawable CAD geometry is available. Re-upload as AutoCAD 2013 DWG with visible lines or polylines, or use the sample BOQ below.`}
          </p>
          {canGenerateFromCad && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleGenerateBoq}>
              Generate BOQ from drawing
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {['Earthwork', 'Concrete', 'Steel', 'Finishes'].map((cat, i) => {
            const count = countCategory(items, cat);
            const amt = sumCategory(items, cat);
            return (
              <div key={cat} className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div className="stat-card-icon" style={{ margin: '0 auto 0.4rem' }}>{['EW', 'CO', 'ST', 'FI'][i]}</div>
                <div style={{ fontWeight: 700 }}>{cat}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{count} items</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginTop: '0.35rem', fontWeight: 700 }}>
                  {formatCompactCurrency(amt)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && <BoqTable items={items} />}
    </div>
  );
}
