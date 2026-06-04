import { useState } from 'react';
import { Link } from 'react-router-dom';
import DrawingUploader from '../components/upload/DrawingUploader';
import { formatNumber } from '../utils/formatters';

const softCell = {
  padding: '0.75rem',
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(165,177,210,0.13)',
  borderRadius: 14,
};

export default function UploadPage() {
  const [complete, setComplete] = useState(false);
  const [drawing, setDrawing] = useState(null);
  const q = drawing?.quantities;
  const extractionAvailable = drawing?.extractionAvailable === true;
  const modelAvailable = drawing?.modelAvailable === true;

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Drawing Upload</h1>
        <p className="page-subtitle">Upload PDF, image, DWG, or DXF drawings for quantity extraction and 3D preview.</p>
      </header>

      <DrawingUploader onComplete={(_, __, uploadedDrawing) => {
        setDrawing(uploadedDrawing);
        setComplete(true);
      }} />

      {complete && (
        <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>
                {extractionAvailable && modelAvailable
                  ? 'BOQ and 3D Ready'
                  : extractionAvailable
                    ? 'BOQ Generated'
                    : modelAvailable
                      ? 'DWG Preview Ready'
                      : 'Upload Complete'}
              </h3>
              {drawing?.serverUploadFailed && (
                <p style={{ color: '#b45309', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                  Server upload did not complete. BOQ and 3D data below are from local CAD analysis only.
                </p>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {extractionAvailable && modelAvailable
                  ? `${drawing?.fileName} - CAD geometry parsed and BOQ rows generated.`
                  : extractionAvailable
                    ? `${drawing?.fileName} - BOQ generated from drawing analysis.`
                    : modelAvailable
                      ? `${drawing?.fileName} parsed for 3D preview. Open BOQ Generator to create quantities from CAD.`
                      : `${drawing?.fileName} uploaded, but a CAD preview could not be generated.${drawing?.cadParseError ? ` ${drawing.cadParseError}` : ' See details on the 3D Visualization page.'}`}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/visualization" className="btn btn-primary">View 3D Preview</Link>
                <Link to="/boq" className="btn btn-ghost">View Generated BOQ</Link>
              </div>
            </div>
            {extractionAvailable && q && (
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Detected Quantities</h3>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  {[
                    ['Wall Area', `${formatNumber(q.wallArea)} m2`],
                    ['Floor Area', `${formatNumber(q.floorArea)} m2`],
                    ['Concrete', `${formatNumber(q.concreteVolume, 1)} m3`],
                    ['Bricks', formatNumber(q.brickQuantity)],
                    ['Paint', `${q.paintQuantity} L`],
                    ['Steel', `${formatNumber(q.steelQuantity, 1)} MT`],
                  ].map(([label, val]) => (
                    <div key={label} style={softCell}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
