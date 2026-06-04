import { CONSTRUCTION_STAGES } from '../../../utils/bimClassification';

const CAMERAS = [
  { id: 'orbit', label: 'Orbit' },
  { id: 'walkthrough', label: 'Walk' },
  { id: 'fps', label: 'FPS' },
  { id: 'drone', label: 'Drone' },
  { id: 'floorplan', label: 'Plan' },
  { id: 'isometric', label: 'ISO' },
];

const DISPLAY_MODES = [
  { id: 'architectural', label: 'Architectural' },
  { id: 'structural', label: 'Structural', discipline: 'structural' },
  { id: 'mep', label: 'MEP', discipline: 'mep' },
  { id: 'wireframe', label: 'Wireframe' },
  { id: 'xray', label: 'X-Ray' },
  { id: 'costHeat', label: 'Cost Heat' },
  { id: 'progressHeat', label: 'Progress Heat' },
];

export default function BIMToolbar({ bimModel, state, onChange }) {
  const floors = bimModel?.floors || [];

  const toggleFloor = (floorId) => {
    const next = new Set(state.hiddenFloors || []);
    if (next.has(floorId)) next.delete(floorId);
    else next.add(floorId);
    onChange({ hiddenFloors: next });
  };

  const setMode = (mode) => {
    const m = DISPLAY_MODES.find((d) => d.id === mode);
    onChange({
      displayMode: mode === 'structural' || mode === 'mep' ? 'architectural' : mode,
      bimDiscipline: m?.discipline || 'architectural',
    });
  };

  return (
    <div className="bim-toolbar">
      <div className="bim-toolbar-group">
        <span className="bim-toolbar-label">Camera</span>
        <div className="bim-toolbar-btns">
          {CAMERAS.map((c) => (
            <button key={c.id} type="button" className={state.cameraMode === c.id ? 'active' : ''} onClick={() => onChange({ cameraMode: c.id })}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bim-toolbar-group">
        <span className="bim-toolbar-label">BIM View</span>
        <div className="bim-toolbar-btns">
          {DISPLAY_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={state.displayMode === m.id || (m.discipline && state.bimDiscipline === m.discipline) ? 'active' : ''}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bim-toolbar-group">
        <span className="bim-toolbar-label">Floors</span>
        <div className="bim-toolbar-btns">
          <button type="button" className={!state.isolatedFloor ? 'active' : ''} onClick={() => onChange({ isolatedFloor: null })}>All</button>
          {floors.map((f) => (
            <button key={f.id} type="button" className={state.isolatedFloor === f.id ? 'active' : ''} onClick={() => onChange({ isolatedFloor: f.id })}>
              {f.label.split(' ')[0]}
            </button>
          ))}
          <button type="button" className={state.exploded ? 'active' : ''} onClick={() => onChange({ exploded: !state.exploded })}>Explode</button>
        </div>
        <div className="bim-floor-toggles">
          {floors.map((f) => (
            <label key={f.id} className="bim-floor-check">
              <input type="checkbox" checked={!state.hiddenFloors?.has(f.id)} onChange={() => toggleFloor(f.id)} />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div className="bim-toolbar-group">
        <span className="bim-toolbar-label">Tools</span>
        <div className="bim-toolbar-btns">
          <button type="button" className={state.sectionEnabled ? 'active' : ''} onClick={() => onChange({ sectionEnabled: !state.sectionEnabled })}>Section Cut</button>
          <button type="button" className={state.showLabels ? 'active' : ''} onClick={() => onChange({ showLabels: !state.showLabels })}>QS Labels</button>
          <button type="button" className={state.showPlanOverlay ? 'active' : ''} onClick={() => onChange({ showPlanOverlay: !state.showPlanOverlay })}>Plan Lines</button>
        </div>
      </div>

      <div className="bim-toolbar-group bim-toolbar-construction">
        <span className="bim-toolbar-label">Construction</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((state.constructionProgress ?? 1) * 100)}
          onChange={(e) => onChange({ constructionProgress: parseInt(e.target.value, 10) / 100 })}
          className="bim-construction-range"
        />
        <div className="bim-construction-stages">
          {CONSTRUCTION_STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.label}
              className={(state.constructionProgress ?? 1) >= s.progress - 0.001 ? 'done' : ''}
              onClick={() => onChange({ constructionProgress: s.id === 'complete' ? 1 : s.progress })}
            />
          ))}
        </div>
        <button
          type="button"
          className="bim-toolbar-complete-btn"
          onClick={() => onChange({ constructionProgress: 1 })}
        >
          Full build
        </button>
      </div>
    </div>
  );
}

export function BIMInspector({ element, onClose }) {
  if (!element) {
    return (
      <div className="bim-inspector bim-inspector--empty">
        <p>Select any wall, column, parking bay, stair, or lift in the 3D model.</p>
      </div>
    );
  }

  const qs = element.qs || {};
  const rows = Object.entries(qs).filter(([k]) => k !== 'layer');

  return (
    <div className="bim-inspector">
      <div className="bim-inspector-head">
        <div>
          <span className="bim-inspector-cat">{element.category}</span>
          <h4>{qs.id || element.id}</h4>
          <p className="bim-inspector-layer">{element.layer}</p>
        </div>
        {onClose && <button type="button" className="bim-inspector-close" onClick={onClose}>Close</button>}
      </div>
      <dl className="bim-inspector-dl">
        {rows.map(([key, val]) => (
          <div key={key}>
            <dt>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</dt>
            <dd>{typeof val === 'number' && key.includes('cost') ? `LKR ${val.toLocaleString()}` : String(val)}</dd>
          </div>
        ))}
      </dl>
      {element.subType && <p className="bim-inspector-note">Type: {element.subType} / Floor: {element.floorId}</p>}
    </div>
  );
}
