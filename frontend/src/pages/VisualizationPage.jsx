import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VisualizationHub from '../components/three/VisualizationHub';
import { buildingElements } from '../data/mockData';
import { getLatestDrawing } from '../utils/drawingSession';
import { analyzeVisualization } from '../utils/vizAnalytics';
import '../styles/visualization.css';

export default function VisualizationPage() {
  const [drawing, setDrawing] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getLatestDrawing()
      .then((stored) => {
        if (!cancelled) setDrawing(stored);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message || 'Failed to load drawing data');
      });
    return () => { cancelled = true; };
  }, []);
  const hasExtractedModel = drawing?.modelAvailable === true && Array.isArray(drawing.buildingElements);
  const usingFallbackModel = Boolean(drawing && !hasExtractedModel);
  const elements = hasExtractedModel ? drawing.buildingElements : buildingElements;
  const analytics = elements.length ? analyzeVisualization(elements, drawing) : null;

  return (
    <div className="page page-viz">
      <header className="page-header viz-page-header">
        <div>
          <h1 className="page-title">3D Building Visualization</h1>
          <p className="page-subtitle">
            {drawing
              ? `Digital twin preview - ${drawing.fileName}`
              : 'Interactive BIM workspace - upload a DWG to begin'}
          </p>
        </div>
        {hasExtractedModel && (
          <div className="viz-header-badges">
            <span className="badge badge-info">CAD Linked</span>
            {drawing.extractionAvailable && <span className="badge badge-success">BOQ Synced</span>}
            {drawing.bimModel?.elements?.length > 0 && (
              <span className="badge badge-success">BIM Twin Active</span>
            )}
            {analytics?.isCeilingPlan && <span className="badge badge-warning">Ceiling Plan</span>}
          </div>
        )}
      </header>

      {loadError && (
        <div className="glass-card viz-callout viz-callout-warning">
          <h3>Drawing data unavailable</h3>
          <p>{loadError}. <Link to="/upload">Re-upload your DWG drawing</Link> to load your project geometry.</p>
        </div>
      )}

      {!drawing && !loadError && (
        <div className="glass-card viz-callout">
          <p>Showing the sample structural model. <Link to="/upload">Upload a DWG drawing</Link> to load your project geometry.</p>
        </div>
      )}

      {drawing && !hasExtractedModel && (
        <div className="glass-card viz-callout viz-callout-warning">
          <h3>Uploaded drawing needs CAD geometry for exact 3D</h3>
          <p>
            {drawing.cadParseError || `${drawing.fileName} could not be parsed. Try AutoCAD 2013 DWG format.`}
            {' '}Showing a conceptual sample 3D model so the visualization workspace remains available.
          </p>
          <Link to="/upload" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>Re-upload drawing</Link>
        </div>
      )}

      {drawing && hasExtractedModel && !drawing.bimModel?.elements?.length && (
        <div className="glass-card viz-callout viz-callout-warning" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>BIM Digital Twin:</strong> Re-upload your DWG to generate a CAD-exact 3D reconstruction
            with walls, parking, ramps, stairs, and lifts matched to your floor plan.
          </p>
          <Link to="/upload" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>Re-upload DWG</Link>
        </div>
      )}

      {drawing && hasExtractedModel && drawing.bimModel?.elements?.length > 0 && (
        <div className="glass-card viz-callout" style={{ marginBottom: '1rem', borderColor: 'rgba(123,112,239,0.24)' }}>
          <p>
            <strong>CAD-exact BIM mode active</strong> - {drawing.bimModel.elements.length.toLocaleString()} elements
            reconstructed from {drawing.cadPreviewMeta?.segmentCount?.toLocaleString() || 'source'} linework segments.
            Use section cut, floor explode, and QS labels in the toolbar below.
          </p>
        </div>
      )}

      {drawing && hasExtractedModel && analytics && (
        <div className="viz-status-bar glass-card">
          <div className="viz-status-item">
            <span className="viz-status-label">Linework segments</span>
            <strong>{drawing.cadPreviewMeta?.segmentCount || drawing.cadPreviewMeta?.renderedEntityCount || elements.length}</strong>
          </div>
          {drawing.cadPreviewMeta?.bimElementCount > 0 && (
            <div className="viz-status-item">
              <span className="viz-status-label">BIM elements</span>
              <strong>{drawing.cadPreviewMeta.bimElementCount}</strong>
            </div>
          )}
          {drawing.bimModel?.floors?.length > 0 && (
            <div className="viz-status-item">
              <span className="viz-status-label">Floors</span>
              <strong>{drawing.bimModel.floors.map((f) => f.label).join(', ')}</strong>
            </div>
          )}
          <div className="viz-status-item">
            <span className="viz-status-label">DWG entities</span>
            <strong>{drawing.cadPreviewMeta?.sourceEntityCount ?? 'source'}</strong>
          </div>
          {analytics.footprint && (
            <div className="viz-status-item">
              <span className="viz-status-label">Plan footprint</span>
              <strong>{analytics.footprint.area} m2</strong>
            </div>
          )}
          {drawing.cadPreviewMeta?.truncated && (
            <div className="viz-status-item viz-status-warn">
              <span className="viz-status-label">Note</span>
              <strong>Some segments capped for performance</strong>
            </div>
          )}
        </div>
      )}

      {usingFallbackModel && (
        <div className="glass-card viz-callout" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>Conceptual mode:</strong> upload a parseable DWG file to replace this sample with your actual CAD-derived 3D geometry.
          </p>
        </div>
      )}

      {elements.length > 0 && (
        <VisualizationHub elements={elements} drawing={usingFallbackModel ? null : drawing} />
      )}
    </div>
  );
}
