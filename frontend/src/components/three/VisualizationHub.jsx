import { useState, useMemo, useCallback, useEffect } from 'react';
import BuildingScene from './BuildingScene';
import BIMViewer from './bim/BIMViewer';
import BIMToolbar, { BIMInspector } from './bim/BIMToolbar';
import { analyzeVisualization } from '../../utils/vizAnalytics';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import '../../styles/visualization.css';

const LEGACY_VIEW_MODES = [
  { id: 'site3d', label: 'Site 3D', icon: '3D', desc: 'Extruded buildings and site massing' },
  { id: 'massing', label: '3D Massing', icon: 'BOX', desc: 'Element boxes and structure' },
  { id: 'plan', label: 'Plan View', icon: 'PLAN', desc: '2D technical overlay' },
  { id: 'heatmap', label: 'Cost Heatmap', icon: 'COST', desc: 'AI cost intensity map' },
  { id: 'xray', label: 'X-Ray Scan', icon: 'XR', desc: 'Transparent structure view' },
];

const DOCK_TABS = [
  { id: 'view', label: 'View Mode' },
  { id: 'layers', label: 'Layers' },
  { id: 'insights', label: 'AI Insights' },
  { id: 'inspector', label: 'Inspector' },
];

export default function VisualizationHub({ elements, drawing }) {
  const bimModel = drawing?.bimModel;
  const useBimViewer = Boolean(bimModel?.elements?.length);

  const [bimToolbar, setBimToolbar] = useState(() => ({
    displayMode: 'architectural',
    bimDiscipline: 'architectural',
    constructionProgress: 1,
    showLabels: false,
    hiddenFloors: new Set(),
    isolatedFloor: null,
    exploded: false,
    sectionEnabled: false,
    sectionY: 5,
    cameraMode: 'orbit',
    showPlanOverlay: true,
    autoRotate: true,
    showcaseMode: true,
  }));

  const patchBimToolbar = useCallback((patch) => {
    setBimToolbar((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (!bimModel?.elements?.length) return;
    setBimToolbar((prev) => ({
      ...prev,
      constructionProgress: 1,
      hiddenFloors: new Set(),
      isolatedFloor: null,
      sectionEnabled: false,
      showPlanOverlay: true,
    }));
  }, [drawing?.fileName, bimModel?.elements?.length]);

  const [viewMode, setViewMode] = useState('massing');
  const [selected, setSelected] = useState(null);
  const [hiddenLayers, setHiddenLayers] = useState(() => new Set());
  const [hiddenTypes, setHiddenTypes] = useState(() => new Set());
  const [dockTab, setDockTab] = useState('view');
  const [dockOpen, setDockOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statsHidden, setStatsHidden] = useState(false);

  const analytics = useMemo(() => analyzeVisualization(elements, drawing), [elements, drawing]);

  const visibleElements = useMemo(
    () => elements.filter((el) => {
      const layer = el.sourceLayer || 'Model';
      if (hiddenLayers.has(layer)) return false;
      if (hiddenTypes.has(el.type)) return false;
      return true;
    }),
    [elements, hiddenLayers, hiddenTypes],
  );

  const toggleLayer = useCallback((name) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const toggleType = useCallback((type) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const openDock = (tab) => {
    setDockTab(tab);
    setDockOpen(true);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  return (
    <div className={`viz-hub ${isFullscreen ? 'viz-hub--fullscreen' : ''}`}>
      {!isFullscreen && !statsHidden && (
        <div className="viz-hub-stats">
          {[
            { label: 'Entities', value: formatNumber(useBimViewer ? bimModel.elements.length : visibleElements.length), sub: 'BIM' },
            { label: 'CAD Source', value: formatNumber(analytics.sourceEntityCount || elements.length), sub: 'entities' },
            ...(useBimViewer ? [{ label: 'Floors', value: bimModel.floors.length, sub: 'levels' }] : []),
            ...(drawing?.cadPreviewMeta?.bimElementCount ? [{ label: 'Reconstructed', value: formatNumber(drawing.cadPreviewMeta.bimElementCount), sub: 'from CAD' }] : []),
            { label: 'Layers', value: analytics.layers.length, sub: 'active' },
            ...(analytics.footprint ? [{ label: 'Footprint', value: `${analytics.footprint.area} m2`, sub: 'plan' }] : []),
          ].map((stat) => (
            <div key={stat.label} className="viz-stat-chip glass-card">
              <span className="viz-stat-label">{stat.label}</span>
              <strong className="viz-stat-value">{stat.value}</strong>
              <span className="viz-stat-sub">{stat.sub}</span>
            </div>
          ))}
          <button type="button" className="viz-stat-hide btn btn-ghost btn-sm" onClick={() => setStatsHidden(true)} title="Hide stats">
            Hide
          </button>
        </div>
      )}

      {!isFullscreen && statsHidden && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setStatsHidden(false)}>
          Show metrics
        </button>
      )}

      <div className="viz-hub-stage">
        <div className="viz-hub-canvas viz-hub-canvas--hero">
          {useBimViewer ? (
            <div className="bim-viewer-wrap">
              <div className="viz-canvas-topbar">
                <div className="viz-canvas-title">
                  <span className="viz-live-dot" />
                  <span>BIM Digital Twin</span>
                  <span className="viz-canvas-file">{drawing?.fileName}</span>
                </div>
                <div className="viz-canvas-mode-badge">CAD-Exact Reconstruction</div>
              </div>
              <BIMViewer
                bimModel={bimModel}
                selected={selected}
                onSelect={setSelected}
                toolbarState={bimToolbar}
                onToolbarChange={patchBimToolbar}
                isFullscreen={isFullscreen}
              />
              <div className="viz-controls">
                <button
                  type="button"
                  className={`btn btn-sm ${bimToolbar.autoRotate ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => patchBimToolbar({ autoRotate: !bimToolbar.autoRotate })}
                >
                  {bimToolbar.autoRotate ? '⏸ Auto orbit' : '↻ Auto orbit'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${bimToolbar.showcaseMode ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => patchBimToolbar({ showcaseMode: !bimToolbar.showcaseMode })}
                >
                  {bimToolbar.showcaseMode ? '✨ Showcase on' : '✨ Showcase'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsFullscreen((f) => !f)}>
                  {isFullscreen ? 'Exit full screen' : 'Full screen'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openDock('inspector')}>
                  Inspector
                </button>
              </div>
            </div>
          ) : (
            <BuildingScene
              elements={visibleElements}
              allElements={elements}
              wireframeLines={drawing?.wireframeLines}
              siteVolumes={drawing?.siteVolumes}
              planSvg={drawing?.planSvg}
              viewMode={viewMode}
              drawing={drawing}
              analytics={analytics}
              selected={selected}
              onSelect={setSelected}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((f) => !f)}
              onOpenDock={openDock}
              viewModes={LEGACY_VIEW_MODES}
              activeViewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </div>

        {!isFullscreen && useBimViewer && (
          <BIMToolbar bimModel={bimModel} state={bimToolbar} onChange={patchBimToolbar} />
        )}

        {!isFullscreen && (
          <div className={`viz-dock glass-card ${dockOpen ? 'viz-dock--open' : 'viz-dock--collapsed'}`}>
            <div className="viz-dock-bar" onClick={() => setDockOpen((open) => !open)}>
              <span className="viz-dock-chevron">{dockOpen ? 'Close' : 'Open'}</span>
              <span className="viz-dock-bar-title">
                {dockOpen ? 'View Mode / Layers / AI Insights' : 'Panels - click to expand'}
              </span>
              <div className="viz-dock-quick" onClick={(e) => e.stopPropagation()}>
                {!useBimViewer && LEGACY_VIEW_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`viz-dock-quick-btn ${viewMode === m.id ? 'active' : ''}`}
                    title={m.label}
                    onClick={() => { setViewMode(m.id); openDock('view'); }}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>
            </div>

            {dockOpen && (
              <div className="viz-dock-body">
                <div className="viz-dock-tabs">
                  {DOCK_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`viz-dock-tab ${dockTab === tab.id ? 'active' : ''}`}
                      onClick={() => setDockTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="viz-dock-content">
                  {dockTab === 'view' && useBimViewer && (
                    <p className="viz-panel-empty">BIM tools are in the toolbar below the viewer: cameras, section cut, floors, and construction timeline.</p>
                  )}

                  {dockTab === 'view' && !useBimViewer && (
                    <div className="viz-mode-grid viz-mode-grid--horizontal">
                      {LEGACY_VIEW_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          className={`viz-mode-btn ${viewMode === mode.id ? 'active' : ''}`}
                          onClick={() => setViewMode(mode.id)}
                        >
                          <span className="viz-mode-icon">{mode.icon}</span>
                          <span className="viz-mode-label">{mode.label}</span>
                          <span className="viz-mode-desc">{mode.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {dockTab === 'layers' && (
                    <div className="viz-dock-split">
                      <div>
                        <h4 className="viz-dock-subtitle">Element Types</h4>
                        <div className="viz-type-list">
                          {analytics.byType.map(({ type, label, count, percent }) => (
                            <label key={type} className="viz-layer-row">
                              <input type="checkbox" checked={!hiddenTypes.has(type)} onChange={() => toggleType(type)} />
                              <span className="viz-type-dot" data-type={type} />
                              <span className="viz-layer-name">{label}</span>
                              <span className="viz-layer-count">{count}</span>
                              <span className="viz-layer-pct">{percent}%</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="viz-dock-subtitle">Layer Explorer</h4>
                        <div className="viz-layer-list">
                          {analytics.layers.slice(0, 32).map(({ name, count }) => (
                            <label key={name} className="viz-layer-row">
                              <input type="checkbox" checked={!hiddenLayers.has(name)} onChange={() => toggleLayer(name)} />
                              <span className="viz-layer-name" title={name}>{name}</span>
                              <span className="viz-layer-count">{count}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {dockTab === 'insights' && (
                    <div className="viz-insights viz-insights--row">
                      {analytics.insights.map((item) => (
                        <div key={item.id} className={`viz-insight viz-insight--${item.level}`}>
                          <strong>{item.title}</strong>
                          <p>{item.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {dockTab === 'inspector' && (
                    <div className="viz-dock-inspector-row">
                      {useBimViewer ? (
                        <BIMInspector element={selected} onClose={() => setSelected(null)} />
                      ) : selected ? (
                        <div className="viz-inspector">
                          <div className="viz-inspector-head">
                            <span className="badge badge-info">{selected.type}</span>
                            <h4>{selected.name}</h4>
                          </div>
                          <dl className="viz-inspector-dl">
                            <dt>CAD Layer</dt><dd>{selected.sourceLayer || '-'}</dd>
                            <dt>Length</dt><dd>{selected.length}</dd>
                            <dt>Material</dt><dd>{selected.material}</dd>
                            <dt>Est. Cost</dt>
                            <dd className="cost-highlight">{formatCurrency(selected.cost || estimateCost(selected))}</dd>
                          </dl>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Clear</button>
                        </div>
                      ) : (
                        <p className="viz-panel-empty">Click an element in the 3D view to inspect it here.</p>
                      )}
                      {drawing?.quantities && (
                        <div className="viz-qty-grid">
                          {[
                            ['Floor', `${drawing.quantities.floorArea} m2`],
                            ['Walls', `${drawing.quantities.wallArea} m2`],
                            ['Concrete', `${drawing.quantities.concreteVolume} m3`],
                            ['Steel', `${drawing.quantities.steelQuantity} MT`],
                          ].map(([k, v]) => (
                            <div key={k} className="viz-qty-cell">
                              <span>{k}</span>
                              <strong>{v}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function estimateCost(element) {
  const rates = { wall: 1850, column: 9200, slab: 8800, door: 18500, window: 14200, roof: 680, cad: 120 };
  return Math.round((element.length || 1) * (rates[element.type] || 150));
}
