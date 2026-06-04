/** CAD layer / entity → BIM semantic classification */

export const FLOOR_DEFS = [
  { id: 'basement', label: 'Basement', elevation: -3.8, order: 0, patterns: /basement|base.?ment|b1-|b-1|b\.?floor|lvl.?0|level.?0|car.?park|parking.?lvl|under/i },
  { id: 'ground', label: 'Ground Floor', elevation: 0, order: 1, patterns: /ground|^gf[^f]|gf-|gf_|lvl.?1|level.?1|gr\.?fl/i },
  { id: 'first', label: 'First Floor', elevation: 3.8, order: 2, patterns: /first|1st|1f|ff-|ff_|lvl.?2|level.?2/i },
  { id: 'second', label: 'Second Floor', elevation: 7.6, order: 3, patterns: /second|2nd|2f|sf-|lvl.?3|level.?3/i },
  { id: 'roof', label: 'Roof', elevation: 11.4, order: 4, patterns: /roof|rf-|rf_|parapet|terrace.?roof/i },
];

export const CATEGORY_RULES = [
  { category: 'parking', subType: 'slot', material: 'asphalt', patterns: /park.?slot|car.?bay|parking.?bay|stall|vehicle.?bay|p-?slot/i, heightM: 0.05 },
  { category: 'parking', subType: 'zone', material: 'asphalt', patterns: /parking|car.?park|garage|basement.?park/i, heightM: 0.08 },
  { category: 'ramp', subType: 'vehicle', material: 'concrete', patterns: /ramp|drive.?ramp|veh.?ramp|incline|slope/i, heightM: 0.15 },
  { category: 'stair', subType: 'core', material: 'concrete', patterns: /stair|st-case|stcase|staircase|st\.?well|steps/i, heightM: 3.2 },
  { category: 'lift', subType: 'shaft', material: 'concrete', patterns: /lift|elev|elevator|core.?lift|lft/i, heightM: 3.2 },
  { category: 'column', subType: 'structural', material: 'concrete', patterns: /column|col-|col_|pillar|pier|grid.?col|struct.?col/i, heightM: 3.2 },
  { category: 'wall', subType: 'external', material: 'brick', patterns: /ext.?wall|external|outer.?wall|facade|perimeter|boundary|compound|plot.?bound|site.?wall/i, heightM: 3.0, thicknessM: 0.23 },
  { category: 'wall', subType: 'internal', material: 'brick', patterns: /int.?wall|internal|partition|room.?wall|a-wall|wall/i, heightM: 3.0, thicknessM: 0.115 },
  { category: 'door', subType: 'opening', material: 'paint', patterns: /door|dr-|dr_|opening.?door/i, heightM: 2.1, thicknessM: 0.05 },
  { category: 'window', subType: 'opening', material: 'glass', patterns: /window|win-|glaz|curtain.?wall/i, heightM: 1.5, thicknessM: 0.04 },
  { category: 'corridor', subType: 'circulation', material: 'tile', patterns: /corridor|passage|circulation|lobby|hall/i, heightM: 0.05 },
  { category: 'service', subType: 'room', material: 'tile', patterns: /service|mech|mechanical|electrical|switch|store|plant/i, heightM: 0.04 },
  { category: 'grid', subType: 'structural', material: 'steel', patterns: /grid|axis|struct.?grid|column.?grid/i, heightM: 0.02 },
  { category: 'slab', subType: 'floor', material: 'concrete', patterns: /slab|floor.?plate|deck|hatch/i, heightM: 0.25 },
  { category: 'road', subType: 'lane', material: 'asphalt', patterns: /road|drive|lane|traffic|marking|arrow/i, heightM: 0.02 },
  { category: 'ramp', subType: 'path', material: 'concrete', patterns: /path|access/i, heightM: 0.1 },
];

export function layerLabel(entity) {
  return `${entity?.layer || ''} ${entity?.name || ''} ${entity?.blockName || ''}`.toLowerCase();
}

export function matchRule(label, rules = CATEGORY_RULES) {
  for (const rule of rules) {
    if (rule.patterns.test(label)) return rule;
  }
  return null;
}

export function detectFloorId(layer, fileName = '') {
  const text = `${layer} ${fileName}`.toLowerCase();
  for (const floor of FLOOR_DEFS) {
    if (floor.patterns.test(text)) return floor.id;
  }
  if (/basement|parking|ramp|garage/i.test(fileName)) return 'basement';
  return 'ground';
}

export function classifyBimEntity(entity, fileName = '') {
  const label = layerLabel(entity);
  const rule = matchRule(label);
  const floorId = detectFloorId(entity?.layer || '', fileName);

  if (rule) {
    return {
      category: rule.category,
      subType: rule.subType,
      material: rule.material,
      floorId,
      heightM: rule.heightM ?? 3.0,
      thicknessM: rule.thicknessM ?? 0.2,
    };
  }

  if (entity?.type === 'CIRCLE' && (entity.radius ?? 0) > 0.15) {
    return { category: 'column', subType: 'structural', material: 'concrete', floorId, heightM: 3.2, thicknessM: 0.4 };
  }

  if (entity?.type === 'HATCH') {
    return { category: 'slab', subType: 'floor', material: 'concrete', floorId, heightM: 0.25, thicknessM: 0.25 };
  }

  if (entity?.type === 'LINE' || entity?.type === 'LWPOLYLINE') {
    return { category: 'wall', subType: 'internal', material: 'brick', floorId, heightM: 3.0, thicknessM: 0.115 };
  }

  return { category: 'linework', subType: 'cad', material: 'paint', floorId, heightM: 0.08, thicknessM: 0.03 };
}

export function isParkingSlotArea(areaDrawingUnits, slotWidthDrawing) {
  const w = slotWidthDrawing || 1;
  const areaM2 = areaDrawingUnits / (w * w) * 12;
  return areaM2 >= 8 && areaM2 <= 35;
}

export function constructionPhase(category) {
  const map = {
    road: 0,
    parking: 0,
    site: 0,
    excavation: 0,
    linework: 0,
    column: 0.2,
    grid: 0.2,
    ramp: 0.4,
    lift: 0.4,
    slab: 0.6,
    wall: 0.75,
    stair: 0.75,
    corridor: 0.75,
    door: 0.9,
    window: 0.9,
    service: 0.9,
  };
  return map[category] ?? 0.5;
}

export const CONSTRUCTION_STAGES = [
  { id: 'excavation', label: 'Site excavation', progress: 0 },
  { id: 'foundation', label: 'Foundation', progress: 0.1 },
  { id: 'columns', label: 'Columns', progress: 0.2 },
  { id: 'beams', label: 'Beams', progress: 0.4 },
  { id: 'slabs', label: 'Slabs', progress: 0.6 },
  { id: 'walls', label: 'Walls', progress: 0.75 },
  { id: 'finishes', label: 'Finishes', progress: 0.9 },
  { id: 'complete', label: 'Completed', progress: 1 },
];

export function categoryVisibleAtProgress(category, progress) {
  if (progress >= 0.99) return true;
  return constructionPhase(category) <= progress + 0.001;
}

export const BIM_VIEW_MODES = {
  architectural: { label: 'Architectural', categories: null },
  structural: { label: 'Structural', categories: ['column', 'grid', 'slab', 'wall'] },
  mep: { label: 'MEP', categories: ['service', 'lift', 'corridor'] },
  wireframe: { label: 'Wireframe', wireframe: true },
  xray: { label: 'X-Ray', xray: true },
};
