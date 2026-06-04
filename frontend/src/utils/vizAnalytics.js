const TYPE_LABELS = {
  slab: 'Slabs',
  wall: 'Walls',
  column: 'Columns',
  door: 'Doors',
  window: 'Windows',
  roof: 'Roof',
  cad: 'CAD Geometry',
};

export function analyzeVisualization(elements = [], drawing = null) {
  const byType = {};
  const layerMap = {};

  elements.forEach((el) => {
    byType[el.type] = (byType[el.type] || 0) + 1;
    const layer = el.sourceLayer || 'Model';
    layerMap[layer] = (layerMap[layer] || 0) + 1;
  });

  const layers = Object.entries(layerMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const totalLength = elements.reduce((s, el) => s + (Number(el.length) || 0), 0);
  const bounds = drawing?.drawingBounds || drawing?.cadPreviewMeta;
  const width = bounds?.width ?? bounds?.drawingWidth;
  const height = bounds?.height ?? bounds?.drawingHeight;

  let footprint = null;
  if (width && height) {
    const w = width > 500 ? width / 1000 : width;
    const h = height > 500 ? height / 1000 : height;
    footprint = { width: Math.round(w * 10) / 10, height: Math.round(h * 10) / 10, area: Math.round(w * h) };
  }

  const isCeilingPlan = /ceiling|reflected|rcp|mep/i.test(drawing?.fileName || '');
  const isFloorPlan = /floor|plan|layout/i.test(drawing?.fileName || '');
  const cadHeavy = (byType.cad || 0) > elements.length * 0.5;

  const insights = buildInsights({
    elements,
    byType,
    layers,
    footprint,
    isCeilingPlan,
    isFloorPlan,
    cadHeavy,
    drawing,
  });

  return {
    totalEntities: elements.length,
    byType: Object.entries(byType).map(([type, count]) => ({
      type,
      label: TYPE_LABELS[type] || type,
      count,
      percent: Math.round((count / elements.length) * 100),
    })),
    layers,
    totalLength: Math.round(totalLength),
    footprint,
    isCeilingPlan,
    isFloorPlan,
    cadHeavy,
    insights,
    sourceEntityCount: drawing?.cadPreviewMeta?.sourceEntityCount,
    truncated: drawing?.cadPreviewMeta?.truncated,
  };
}

function buildInsights(ctx) {
  const list = [];
  const { elements, byType, layers, footprint, isCeilingPlan, cadHeavy, drawing } = ctx;

  if (isCeilingPlan) {
    list.push({
      id: 'ceiling',
      level: 'info',
      title: 'Reflected ceiling plan detected',
      text: 'Geometry is interpreted as overhead MEP + ceiling grid. Use 3D Massing view to extrude services for spatial review.',
    });
  }

  if (cadHeavy) {
    list.push({
      id: 'cad',
      level: 'warning',
      title: 'High-density linework',
      text: `${byType.cad || 0} CAD segments parsed. Layer filters help isolate structure vs services.`,
    });
  }

  if (layers.length > 8) {
    list.push({
      id: 'layers',
      level: 'info',
      title: `${layers.length} active layers`,
      text: `Dominant layer: "${layers[0].name}" (${layers[0].count} entities). Toggle layers in the explorer to reduce clutter.`,
    });
  }

  if (footprint) {
    list.push({
      id: 'footprint',
      level: 'success',
      title: 'Drawing footprint estimated',
      text: `Approx. ${footprint.width} × ${footprint.height} m (${footprint.area} m² plan area) from CAD extents.`,
    });
  }

  if (drawing?.extractionAvailable && drawing?.quantities) {
    const q = drawing.quantities;
    list.push({
      id: 'boq',
      level: 'success',
      title: 'BOQ quantities linked',
      text: `Wall ${q.wallArea} m² · Concrete ${q.concreteVolume} m³ · Steel ${q.steelQuantity} MT — synced with BOQ Generator.`,
    });
  }

  const segmentCount = drawing?.cadPreviewMeta?.segmentCount;
  if (segmentCount > 4500) {
    list.push({
      id: 'perf',
      level: 'warning',
      title: 'Large site drawing',
      text: `Parsed ${segmentCount} linework segments. Use Plan View for accurate 2D layout matching AutoCAD.`,
    });
  }

  if (drawing?.cadPreviewMeta?.hasSvg) {
    list.push({
      id: 'svg',
      level: 'success',
      title: 'Vector plan overlay active',
      text: 'SVG export from DWG is rendered on the floor plane — closest match to your AutoCAD view.',
    });
  }

  if (!list.length) {
    list.push({
      id: 'default',
      level: 'info',
      title: 'Interactive BIM preview',
      text: 'Select any element to inspect layer, dimensions, and quantity data. Switch view modes for plan, massing, or cost heatmap.',
    });
  }

  return list;
}

export function estimateElementCost(element) {
  const rates = { wall: 1850, column: 9200, slab: 8800, door: 18500, window: 14200, roof: 680, cad: 120 };
  const rate = rates[element.type] || 150;
  const qty = element.area || element.volume || element.length || 1;
  return Math.round(qty * rate);
}

export function heatmapColor(element, maxCost) {
  const cost = estimateElementCost(element);
  const t = Math.min(1, cost / Math.max(maxCost, 1));
  const hue = (1 - t) * 200;
  return `hsl(${hue}, 85%, 55%)`;
}
