import {
  FLOOR_DEFS,
  classifyBimEntity,
  detectFloorId,
  constructionPhase,
} from './bimClassification';
import {
  qsWall,
  qsColumn,
  qsParking,
  qsStair,
  qsLift,
  qsRamp,
  qsSlab,
} from './bimQuantities';

function polygonArea(verts) {
  let sum = 0;
  for (let i = 0; i < verts.length; i += 1) {
    const j = (i + 1) % verts.length;
    sum += verts[i].x * verts[j].y - verts[j].x * verts[i].y;
  }
  return Math.abs(sum) / 2;
}

function polygonCentroid(verts) {
  const cx = verts.reduce((s, v) => s + v.x, 0) / verts.length;
  const cy = verts.reduce((s, v) => s + v.y, 0) / verts.length;
  return { x: cx, y: cy };
}

function bboxOfVerts(verts) {
  const xs = verts.map((v) => v.x);
  const ys = verts.map((v) => v.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

/**
 * Build BIM model from raw CAD flatten output — geometry matches drawing exactly.
 */
const MAX_BIM_WALL_SEGMENTS = 3500;

function sampleSegments(segments, max = MAX_BIM_WALL_SEGMENTS) {
  if (segments.length <= max) return segments;
  const step = Math.ceil(segments.length / max);
  return segments.filter((_, i) => i % step === 0);
}

export function reconstructBimModel({
  segments = [],
  footprints = [],
  markers = [],
  bounds,
  normalizer,
  fileName = '',
  maxWallSegments = MAX_BIM_WALL_SEGMENTS,
}) {
  const wallSegments = sampleSegments(segments, maxWallSegments);
  const drawingWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const drawingHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const drawingSpan = Math.max(drawingWidth, drawingHeight);
  const unitsPerMetre = drawingSpan > 500 ? 1000 : drawingSpan > 50 ? 100 : 1;
  const metresPerDrawingUnit = 1 / unitsPerMetre;
  const sceneSpanM = drawingSpan * metresPerDrawingUnit;
  const sceneUnitsPerMetre = 30 / Math.max(sceneSpanM, 1);

  const m = (drawingDist) => drawingDist * metresPerDrawingUnit;
  const su = (metres) => metres * sceneUnitsPerMetre;

  const floorIdsUsed = new Set();
  const elements = [];
  let wallIndex = 0;
  let colIndex = 0;
  let parkIndex = 0;

  const floorElevation = (floorId) => {
    const def = FLOOR_DEFS.find((f) => f.id === floorId);
    return def ? def.elevation : 0;
  };

  const addElement = (el) => {
    floorIdsUsed.add(el.floorId);
    elements.push(el);
  };

  // ── Walls & linework from CAD segments (sampled on very large drawings) ──
  wallSegments.forEach((seg, i) => {
    const cls = classifyBimEntity(seg.entity, fileName);
    if (cls.category === 'road' && cls.subType === 'lane') {
      const start = normalizer.normalize(seg.start);
      const end = normalizer.normalize(seg.end);
      const lenM = m(Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y));
      if (lenM < 0.15) return;
      addElement({
        id: `lane-${i}`,
        category: 'road',
        subType: 'marking',
        floorId: cls.floorId,
        geomType: 'segment',
        start: [start.x, su(0.01) + su(floorElevation(cls.floorId)), start.z],
        end: [end.x, su(0.01) + su(floorElevation(cls.floorId)), end.z],
        height: su(0.02),
        thickness: su(0.15),
        material: 'asphalt',
        layer: seg.entity.layer || '',
        progress: constructionPhase('road'),
        qs: { id: `LN-${i}`, lengthM: lenM, cost: 0 },
      });
      return;
    }

    if (cls.category === 'wall' || cls.category === 'door' || cls.category === 'window' || cls.category === 'grid') {
      const start = normalizer.normalize(seg.start);
      const end = normalizer.normalize(seg.end);
      const lenDrawing = Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y);
      const lenM = m(lenDrawing);
      if (lenM < 0.08) return;

      const elev = su(floorElevation(cls.floorId));
      const h = su(cls.heightM);
      const thick = su(cls.thicknessM);
      const midY = elev + h / 2;
      const qs =
        cls.category === 'wall'
          ? qsWall({
              lengthM: lenM,
              heightM: cls.heightM,
              thicknessM: cls.thicknessM,
              id: `W-${++wallIndex}`,
              layer: seg.entity.layer,
            })
          : { id: `${cls.category}-${i}`, lengthM: lenM, cost: 0, layer: seg.entity.layer };

      addElement({
        id: `seg-${i}`,
        category: cls.category,
        subType: cls.subType,
        floorId: cls.floorId,
        geomType: 'segment',
        start: [start.x, midY, start.z],
        end: [end.x, midY, end.z],
        height: h,
        thickness: thick,
        material: cls.material,
        layer: seg.entity.layer || '',
        progress: constructionPhase(cls.category),
        qs,
      });
      return;
    }

    if (cls.category === 'ramp' && seg.entity?.type === 'ARC') {
      const arcCenter = seg.entity.center || seg.start;
      const center = normalizer.normalize({ x: arcCenter.x, y: arcCenter.y });
      const lenM = m((seg.entity.radius ?? 1) * 1.2);
      const elev = su(floorElevation(cls.floorId));
      addElement({
        id: `ramp-arc-${i}`,
        category: 'ramp',
        subType: 'vehicle',
        floorId: cls.floorId,
        geomType: 'rampArc',
        center: [center.x, elev, center.z],
        radius: su(m(seg.entity.radius ?? 1)),
        startAngle: seg.entity.startAngle ?? 0,
        endAngle: seg.entity.endAngle ?? Math.PI,
        width: su(3.5),
        slope: 0.08,
        material: 'concrete',
        layer: seg.entity.layer || '',
        progress: constructionPhase('ramp'),
        qs: qsRamp({ lengthM: lenM, widthM: 3.5, layer: seg.entity.layer }),
      });
      return;
    }

    // Fallback trace for sampled segments not matched to walls/ramps/roads
    const start = normalizer.normalize(seg.start);
    const end = normalizer.normalize(seg.end);
    const lenM = m(Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y));
    if (lenM < 0.04) return;
    const elev = su(floorElevation(cls.floorId));
    const h = su(cls.category === 'linework' ? 0.15 : cls.heightM);
    const thick = su(cls.category === 'linework' ? 0.06 : cls.thicknessM);
    addElement({
      id: `trace-${i}`,
      category: cls.category === 'linework' ? 'wall' : cls.category,
      subType: cls.subType === 'cad' ? 'cad-trace' : cls.subType,
      floorId: cls.floorId,
      geomType: 'segment',
      start: [start.x, elev + h / 2, start.z],
      end: [end.x, elev + h / 2, end.z],
      height: h,
      thickness: thick,
      material: cls.material,
      layer: seg.entity.layer || '',
      progress: constructionPhase(cls.category === 'linework' ? 'wall' : cls.category),
      qs: qsWall({
        lengthM: lenM,
        heightM: cls.heightM,
        thicknessM: cls.thicknessM,
        id: `L-${i}`,
        layer: seg.entity.layer,
      }),
    });
  });

  // ── Footprints: parking, slabs, stairs, lifts, rooms ──
  footprints.forEach((fp, i) => {
    const cls = classifyBimEntity(fp.entity, fileName);
    const verts = fp.points.map((p) => normalizer.normalize(p));
    const areaDrawing = fp.area;
    const actualAreaM2 = polygonArea(fp.points) * metresPerDrawingUnit * metresPerDrawingUnit;
    const shape = verts.map((p) => ({ x: p.x, z: p.z }));
    const centroid = polygonCentroid(verts);
    const bb = bboxOfVerts(verts);
    const elev = su(floorElevation(cls.floorId));

    if (cls.category === 'parking' || (cls.category === 'slab' && /park/i.test(layerLabel(fp.entity)))) {
      const slotW = m(bb.width);
      const slotD = m(bb.height);
      const isSlot = actualAreaM2 >= 8 && actualAreaM2 <= 40 && slotW >= 2 && slotD >= 4;

      addElement({
        id: `park-${++parkIndex}`,
        category: 'parking',
        subType: isSlot ? 'slot' : 'zone',
        floorId: cls.floorId,
        geomType: 'footprint',
        shape,
        center: [centroid.x, elev + su(0.02), centroid.z],
        height: su(0.05),
        material: 'asphalt',
        layer: fp.entity.layer || '',
        progress: constructionPhase('parking'),
        qs: qsParking({ areaM2: actualAreaM2, layer: fp.entity.layer }),
        showVehicle: isSlot,
      });
      return;
    }

    if (cls.category === 'stair') {
      addElement({
        id: `stair-${i}`,
        category: 'stair',
        subType: 'core',
        floorId: cls.floorId,
        geomType: 'stair',
        shape,
        center: [centroid.x, elev, centroid.z],
        width: su(m(bb.width)),
        depth: su(m(bb.height)),
        height: su(3.2),
        material: 'concrete',
        layer: fp.entity.layer || '',
        progress: constructionPhase('stair'),
        qs: qsStair({
          widthM: m(bb.width),
          depthM: m(bb.height),
          heightM: 3.2,
          layer: fp.entity.layer,
        }),
      });
      return;
    }

    if (cls.category === 'lift') {
      addElement({
        id: `lift-${i}`,
        category: 'lift',
        subType: 'shaft',
        floorId: cls.floorId,
        geomType: 'lift',
        shape,
        center: [centroid.x, elev, centroid.z],
        width: su(m(bb.width)),
        depth: su(m(bb.height)),
        height: su(3.2),
        material: 'concrete',
        layer: fp.entity.layer || '',
        progress: constructionPhase('lift'),
        qs: qsLift({
          widthM: m(bb.width),
          depthM: m(bb.height),
          heightM: 3.2,
          layer: fp.entity.layer,
        }),
      });
      return;
    }

    if (cls.category === 'slab' || cls.category === 'corridor' || cls.category === 'service') {
      const h = su(cls.heightM);
      addElement({
        id: `slab-${i}`,
        category: cls.category,
        subType: cls.subType,
        floorId: cls.floorId,
        geomType: 'footprint',
        shape,
        center: [centroid.x, elev + h / 2, centroid.z],
        height: h,
        material: cls.material,
        layer: fp.entity.layer || '',
        progress: constructionPhase(cls.category),
        qs: qsSlab({ areaM2: actualAreaM2, thicknessM: cls.heightM, layer: fp.entity.layer }),
      });
    }
  });

  // ── Columns from markers / circles ──
  markers.forEach((mk, i) => {
    const cls = classifyBimEntity(mk.entity, fileName);
    if (cls.category !== 'column' && mk.entity?.type !== 'CIRCLE') return;
    const center = normalizer.normalize(mk.center);
    const diamM = m((mk.radius ?? 0.2) * 2);
    if (diamM < 0.15) return;
    const elev = su(floorElevation(cls.floorId));
    const h = su(cls.heightM);
    addElement({
      id: `col-${++colIndex}`,
      category: 'column',
      subType: 'structural',
      floorId: cls.floorId,
      geomType: 'column',
      center: [center.x, elev + h / 2, center.z],
      diameter: su(diamM),
      height: h,
      material: 'concrete',
      layer: mk.entity.layer || '',
      progress: constructionPhase('column'),
      qs: qsColumn({ diameterM: diamM, heightM: cls.heightM, layer: mk.entity.layer }),
    });
  });

  // Site slab from outer bounds
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ].map((p) => normalizer.normalize(p));
  const siteFloorId = detectFloorId('', fileName);
  const siteElev = su(floorElevation(siteFloorId));

  addElement({
    id: 'site-slab',
    category: 'slab',
    subType: 'site',
    floorId: siteFloorId,
    geomType: 'footprint',
    shape: corners.map((p) => ({ x: p.x, z: p.z })),
    center: [normalizer.normalize({ x: cx, y: cy }).x, siteElev + su(0.06), normalizer.normalize({ x: cx, y: cy }).z],
    height: su(0.12),
    material: 'concrete',
    layer: 'SITE',
    progress: 0.1,
    qs: qsSlab({
      areaM2: m(drawingWidth) * m(drawingHeight),
      thicknessM: 0.12,
      layer: 'SITE',
    }),
  });

  const floors = FLOOR_DEFS.filter((f) => floorIdsUsed.has(f.id)).sort((a, b) => a.order - b.order);
  if (floors.length === 0) {
    floors.push(FLOOR_DEFS.find((f) => f.id === siteFloorId) || FLOOR_DEFS[1]);
  }

  const planOutline = segments.slice(0, 8000).map((seg, i) => {
    const s = normalizer.normalize(seg.start);
    const e = normalizer.normalize(seg.end);
    const cls = classifyBimEntity(seg.entity, fileName);
    return {
      id: `plan-${i}`,
      start: [s.x, siteElev + su(0.15), s.z],
      end: [e.x, siteElev + su(0.15), e.z],
      category: cls.category,
      layer: seg.entity.layer,
    };
  });

  return {
    floors,
    elements,
    planOutline,
    meta: {
      fileName,
      sceneUnitsPerMetre,
      metresPerDrawingUnit,
      drawingWidthM: m(drawingWidth),
      drawingHeightM: m(drawingHeight),
      elementCount: elements.length,
      segmentCount: segments.length,
      footprintCount: footprints.length,
    },
  };
}

function layerLabel(entity) {
  return `${entity?.layer || ''} ${entity?.name || ''}`.toLowerCase();
}

function isFinitePoint(p) {
  return Array.isArray(p) && p.length >= 3 && p.every((v) => Number.isFinite(v));
}

export function getBimBounds(bimModel) {
  const pts = [];
  (bimModel?.elements || []).forEach((el) => {
    if (el.geomType === 'segment') {
      if (isFinitePoint(el.start)) pts.push(el.start);
      if (isFinitePoint(el.end)) pts.push(el.end);
    } else if (el.center && isFinitePoint(el.center)) {
      pts.push(el.center);
      if (Number.isFinite(el.height)) {
        pts.push([el.center[0], el.center[1] + el.height / 2, el.center[2]]);
        pts.push([el.center[0], el.center[1] - el.height / 2, el.center[2]]);
      }
    } else if (el.shape?.length && isFinitePoint(el.center)) {
      const baseY = el.center[1];
      el.shape.forEach((p) => {
        if (Number.isFinite(p.x) && Number.isFinite(p.z)) pts.push([p.x, baseY, p.z]);
      });
    }
  });
  if (!pts.length) {
    return { span: 20, centerX: 0, centerY: 2, centerZ: 0 };
  }
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const zs = pts.map((p) => p[2]);
  const span = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...zs) - Math.min(...zs),
    Math.max(...ys) - Math.min(...ys),
    10,
  );
  const safeSpan = Number.isFinite(span) && span > 0 ? span : 20;
  return {
    span: safeSpan,
    centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
    centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
    centerZ: (Math.min(...zs) + Math.max(...zs)) / 2,
  };
}

export function filterElementsByFloor(elements, floorId, hiddenFloors) {
  return elements.filter((el) => {
    if (hiddenFloors.has(el.floorId)) return false;
    if (floorId && floorId !== 'all' && el.floorId !== floorId) return false;
    return true;
  });
}

export function explodeOffset(floorId, floors, spacing = 8) {
  const ordered = [...floors].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((f) => f.id === floorId);
  return idx >= 0 ? idx * spacing : 0;
}
