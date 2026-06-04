/** QS quantity calculations from BIM elements (metres) */

const RATES = {
  brickPerM2: 4200,
  concretePerM3: 18500,
  steelPerKg: 285,
  paintPerM2: 890,
  tilePerM2: 3450,
  asphaltPerM2: 2800,
  parkingPerM2: 4500,
};

export function qsWall({ lengthM, heightM, thicknessM, id, layer }) {
  const area = lengthM * heightM;
  const volume = area * thicknessM;
  const brickQty = Math.round(area * 55 * (thicknessM / 0.115));
  const cost = Math.round(area * RATES.brickPerM2 + volume * RATES.concretePerM3 * 0.15);
  return {
    id: id || `W-${Math.round(lengthM * 10)}`,
    lengthM: round2(lengthM),
    heightM: round2(heightM),
    thicknessM: round2(thicknessM),
    areaM2: round2(area),
    brickQty,
    cost,
    layer,
  };
}

export function qsColumn({ diameterM, heightM, id, layer }) {
  const r = diameterM / 2;
  const volume = Math.PI * r * r * heightM;
  const steelKg = Math.round(volume * 120);
  const cost = Math.round(volume * RATES.concretePerM3 + steelKg * RATES.steelPerKg);
  return {
    id: id || `C-${Math.round(diameterM * 100)}`,
    diameterM: round2(diameterM),
    heightM: round2(heightM),
    concreteM3: round2(volume),
    steelKg,
    cost,
    layer,
  };
}

export function qsParking({ areaM2, id, layer }) {
  const cost = Math.round(areaM2 * RATES.parkingPerM2);
  return { id: id || `P-${Math.round(areaM2)}`, areaM2: round2(areaM2), cost, layer };
}

export function qsStair({ widthM, depthM, heightM, id, layer }) {
  const rise = 0.175;
  const steps = Math.max(1, Math.round(heightM / rise));
  const volume = widthM * depthM * heightM * 0.45;
  const cost = Math.round(volume * RATES.concretePerM3);
  return {
    id: id || `ST-${steps}`,
    steps,
    widthM: round2(widthM),
    depthM: round2(depthM),
    heightM: round2(heightM),
    concreteM3: round2(volume),
    cost,
    layer,
  };
}

export function qsLift({ widthM, depthM, heightM, id, layer }) {
  return {
    id: id || 'LF-1',
    shaftWidthM: round2(widthM),
    shaftDepthM: round2(depthM),
    shaftHeightM: round2(heightM),
    cost: Math.round(widthM * depthM * heightM * 8500),
    layer,
  };
}

export function qsRamp({ lengthM, widthM, id, layer }) {
  const area = lengthM * widthM;
  return {
    id: id || `R-${Math.round(lengthM)}`,
    lengthM: round2(lengthM),
    widthM: round2(widthM),
    slopePct: round2(8),
    areaM2: round2(area),
    cost: Math.round(area * RATES.concretePerM3 * 0.15),
    layer,
  };
}

export function qsSlab({ areaM2, thicknessM, id, layer }) {
  const volume = areaM2 * thicknessM;
  return {
    id: id || `SL-${Math.round(areaM2)}`,
    areaM2: round2(areaM2),
    concreteM3: round2(volume),
    cost: Math.round(volume * RATES.concretePerM3),
    layer,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function progressHeatColor(progress) {
  if (progress >= 0.95) return '#22c55e';
  if (progress >= 0.5) return '#eab308';
  return '#ef4444';
}

export function costHeatColor(cost, maxCost) {
  const t = maxCost > 0 ? cost / maxCost : 0;
  if (t > 0.66) return '#ef4444';
  if (t > 0.33) return '#f97316';
  return '#22c55e';
}
