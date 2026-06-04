import { reconstructBimModel } from './bimReconstruction';
const MAX_PREVIEW_ELEMENTS = 5000;
const TARGET_SCENE_SIZE = 30;
const LIBREDWG_WASM_BASE = `${import.meta.env.BASE_URL}libredwg/`;
const MAX_BLOCK_DEPTH = 6;

function getCadExtension(fileName = '') {
  const name = fileName.trim().toLowerCase();
  if (name.endsWith('.dwg')) return 'dwg';
  if (name.endsWith('.dxf')) return 'dxf';
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function point(x = 0, y = 0) {
  return { x: Number(x) || 0, y: Number(y) || 0 };
}

function classifyEntity(entity) {
  const label = `${entity.layer || ''} ${entity.name || ''}`.toLowerCase();
  if (entity.type === 'HATCH') return 'slab';
  if (label.includes('column') || label.includes('col') || label.includes('grid')) return 'column';
  if (label.includes('wall') || label.includes('bound') || label.includes('plot')) return 'wall';
  if (label.includes('door')) return 'door';
  if (label.includes('window')) return 'window';
  if (label.includes('road') || label.includes('drive') || label.includes('path')) return 'cad';
  if (label.includes('slab') || label.includes('roof') || label.includes('villa') || label.includes('building')) return 'slab';
  return 'cad';
}

function sampleArc(center, radius, startAngle = 0, endAngle = Math.PI * 2) {
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += Math.PI * 2;
  const steps = Math.max(12, Math.ceil(sweep / (Math.PI / 24)));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = startAngle + (sweep * index) / steps;
    return point(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
  });
}

function addPolylineSegments(segments, entity, vertices, closed = false) {
  const valid = vertices.filter((v) => Number.isFinite(v.x) && Number.isFinite(v.y));
  for (let index = 1; index < valid.length; index += 1) {
    segments.push({ entity, start: valid[index - 1], end: valid[index] });
  }
  if (closed && valid.length > 2) {
    segments.push({ entity, start: valid.at(-1), end: valid[0] });
  }
}

function buildBlockMap(database) {
  const map = new Map();
  const entries = database.tables?.BLOCK_RECORD?.entries || [];
  entries.forEach((block) => {
    if (block?.name) {
      map.set(block.name.toLowerCase(), block);
      map.set(block.name, block);
    }
  });
  return map;
}

function composeTransform(parent, insert) {
  const rot = insert.rotation ?? 0;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const sx = insert.xScale ?? 1;
  const sy = insert.yScale ?? 1;
  const ox = insert.insertionPoint?.x ?? 0;
  const oy = insert.insertionPoint?.y ?? 0;

  if (!parent) {
    return { ox, oy, sx, sy, cos, sin };
  }

  const px = parent.ox + (ox * parent.sx) * parent.cos - (oy * parent.sy) * parent.sin;
  const py = parent.oy + (ox * parent.sx) * parent.sin + (oy * parent.sy) * parent.cos;
  return {
    ox: px,
    oy: py,
    sx: parent.sx * sx,
    sy: parent.sy * sy,
    cos: parent.cos * cos - parent.sin * sin,
    sin: parent.sin * cos + parent.cos * sin,
  };
}

function applyTransform(p, tr) {
  if (!tr) return p;
  const x = p.x * tr.sx;
  const y = p.y * tr.sy;
  return point(
    tr.ox + x * tr.cos - y * tr.sin,
    tr.oy + x * tr.sin + y * tr.cos,
  );
}

function polygonArea(verts) {
  let sum = 0;
  for (let i = 0; i < verts.length; i += 1) {
    const j = (i + 1) % verts.length;
    sum += verts[i].x * verts[j].y - verts[j].x * verts[i].y;
  }
  return Math.abs(sum) / 2;
}

function footprintExtrudeHeight(entity) {
  const layer = `${entity.layer || ''} ${entity.name || ''}`.toLowerCase();
  if (/villa|building|prop|struct|house|floor|slab|roof/.test(layer)) return 3.8;
  if (/wall|bound|plot|fence|compound/.test(layer)) return 2.6;
  if (/road|drive|path|parking/.test(layer)) return 0.2;
  if (/park|land|green|garden/.test(layer)) return 0.35;
  if (/water|tank|pool/.test(layer)) return 0.5;
  if (entity.type === 'HATCH') return 3.5;
  return 1.2;
}

function pushFootprint(footprints, entity, points) {
  if (points.length < 3) return;
  const area = polygonArea(points);
  if (area < 0.08) return;
  footprints.push({
    entity,
    points,
    area,
    height: footprintExtrudeHeight(entity),
    type: classifyEntity(entity),
  });
}

function collectHatch(entity, segments, tr, footprints) {
  const paths = entity.boundaryPaths || [];
  paths.forEach((path) => {
    if (path.vertices?.length) {
      const verts = path.vertices.map((v) => applyTransform(point(v.x, v.y), tr));
      const closed = Boolean(path.isClosed) || path.vertices.length > 2;
      if (closed && (entity.solidFill === 1 || entity.solidFill === true || polygonArea(verts) > 0.4)) {
        pushFootprint(footprints, entity, verts);
      }
      addPolylineSegments(segments, entity, verts, closed);
    }
    (path.edges || []).forEach((edge) => {
      if (edge.start && edge.end) {
        segments.push({
          entity,
          start: applyTransform(point(edge.start.x, edge.start.y), tr),
          end: applyTransform(point(edge.end.x, edge.end.y), tr),
        });
      } else if (edge.center && edge.radius != null) {
        const arcVerts = sampleArc(
          applyTransform(point(edge.center.x, edge.center.y), tr),
          edge.radius * (tr?.sx ?? 1),
          edge.startAngle ?? 0,
          edge.endAngle ?? Math.PI * 2,
        );
        addPolylineSegments(segments, entity, arcVerts, false);
      } else if (edge.controlPoints?.length) {
        addPolylineSegments(
          segments,
          entity,
          edge.controlPoints.map((cp) => applyTransform(point(cp.x, cp.y), tr)),
          false,
        );
      }
    });
  });
}

function collectFromEntity(entity, segments, markers, blockMap, tr, depth, footprints) {
  if (!entity?.type) return;

  if (entity.type === 'INSERT') {
    const block =
      blockMap.get(entity.name) ||
      blockMap.get(entity.name?.toLowerCase());
    const childTr = composeTransform(tr, entity);
    if (block?.entities?.length && depth < MAX_BLOCK_DEPTH) {
      block.entities.forEach((child) =>
        collectFromEntity(child, segments, markers, blockMap, childTr, depth + 1, footprints),
      );
    } else {
      markers.push({
        entity,
        center: applyTransform(point(entity.insertionPoint?.x, entity.insertionPoint?.y), tr),
        radius: 0.5,
      });
    }
    return;
  }

  if (entity.type === 'HATCH') {
    collectHatch(entity, segments, tr, footprints);
    return;
  }

  if (entity.type === 'LINE') {
    segments.push({
      entity,
      start: applyTransform(point(entity.startPoint?.x, entity.startPoint?.y), tr),
      end: applyTransform(point(entity.endPoint?.x, entity.endPoint?.y), tr),
    });
    return;
  }

  if (entity.type === 'LWPOLYLINE') {
    const verts = (entity.vertices || []).map((v) => applyTransform(point(v.x, v.y), tr));
    const closed = Boolean(entity.flag & 1);
    if (closed && verts.length >= 3) pushFootprint(footprints, entity, verts);
    addPolylineSegments(segments, entity, verts, closed);
    return;
  }

  if (entity.type === 'POLYLINE2D' || entity.type === 'POLYLINE3D') {
    const verts = (entity.vertices || []).map((v) => applyTransform(point(v.x, v.y), tr));
    const closed = Boolean(entity.flag & 1);
    if (closed && verts.length >= 3) pushFootprint(footprints, entity, verts);
    addPolylineSegments(segments, entity, verts, closed);
    return;
  }

  if (entity.type === 'ARC') {
    const center = applyTransform(point(entity.center?.x, entity.center?.y), tr);
    const r = (entity.radius ?? 1) * (tr?.sx ?? 1);
    addPolylineSegments(
      segments,
      entity,
      sampleArc(center, r, entity.startAngle, entity.endAngle),
      false,
    );
    return;
  }

  if (entity.type === 'CIRCLE') {
    const center = applyTransform(point(entity.center?.x, entity.center?.y), tr);
    const r = (entity.radius ?? 1) * (tr?.sx ?? 1);
    const verts = sampleArc(center, r);
    if (r > 0.6 && polygonArea(verts) > 0.5) pushFootprint(footprints, entity, verts);
    addPolylineSegments(segments, entity, verts, true);
    markers.push({ entity, center, radius: r });
    return;
  }

  if (entity.type === 'SPLINE' && entity.controlPoints?.length) {
    addPolylineSegments(
      segments,
      entity,
      entity.controlPoints.map((cp) => applyTransform(point(cp.x, cp.y), tr)),
      false,
    );
    return;
  }

  if (entity.type === 'ELLIPSE' && entity.center) {
    const center = applyTransform(point(entity.center.x, entity.center.y), tr);
    const rx = (entity.majorAxis?.x ?? entity.radius ?? 1) * (tr?.sx ?? 1);
    const ry = (entity.minorAxis?.y ?? rx * (entity.axisRatio || 0.5)) * (tr?.sy ?? 1);
    const verts = Array.from({ length: 25 }, (_, i) => {
      const t = (i / 24) * Math.PI * 2;
      return point(center.x + Math.cos(t) * rx, center.y + Math.sin(t) * ry);
    });
    addPolylineSegments(segments, entity, verts, true);
    return;
  }

  if (entity.type === 'POINT') {
    markers.push({
      entity,
      center: applyTransform(point(entity.position?.x, entity.position?.y), tr),
      radius: 0.2,
    });
  }
}

function flattenDatabaseGeometry(database) {
  const blockMap = buildBlockMap(database);
  const segments = [];
  const markers = [];
  const footprints = [];

  (database.entities || []).forEach((entity) => {
    if (entity.isInPaperSpace) return;
    collectFromEntity(entity, segments, markers, blockMap, null, 0, footprints);
  });

  if (segments.length < 20) {
    (database.tables?.BLOCK_RECORD?.entries || []).forEach((block) => {
      const skip = /^\*|model|paper/i.test(block.name);
      if (skip) return;
      (block.entities || []).forEach((entity) => {
        collectFromEntity(entity, segments, markers, blockMap, null, 0, footprints);
      });
    });
  }

  return { segments, markers, footprints, blockMap };
}

function circleShape(radius, segments = 14) {
  return Array.from({ length: segments }, (_, i) => {
    const t = (i / segments) * Math.PI * 2;
    return { x: Math.cos(t) * radius, y: Math.sin(t) * radius };
  });
}

function buildSiteVolumes(footprints, normalizer, limit = 150) {
  return [...footprints]
    .sort((a, b) => b.area - a.area)
    .slice(0, limit)
    .map((fp, index) => {
      const normalized = fp.points.map((p) => normalizer.normalize(p));
      const xs = normalized.map((p) => p.x);
      const zs = normalized.map((p) => p.z);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      return {
        id: `site-vol-${index}`,
        layer: fp.entity.layer || 'CAD',
        type: fp.type,
        height: fp.height,
        area: fp.area,
        center: [cx, fp.height / 2, cz],
        shape: normalized.map((p) => ({ x: p.x - cx, y: p.z - cz })),
      };
    });
}

function buildVolumesFromMarkers(markers, normalizer, limit = 80) {
  return markers
    .filter((m) => (m.radius ?? 0) * normalizer.scale > 0.2)
    .slice(0, limit)
    .map((marker, index) => {
      const center = normalizer.normalize(marker.center);
      const r = Math.max((marker.radius ?? 0.5) * normalizer.scale, 0.6);
      const type = classifyEntity(marker.entity);
      const height = footprintExtrudeHeight(marker.entity);
      return {
        id: `marker-vol-${index}`,
        layer: marker.entity.layer || marker.entity.name || 'Block',
        type,
        height,
        area: Math.PI * r * r,
        center: [center.x, height / 2, center.z],
        shape: circleShape(r),
      };
    });
}

/** Rebuild 3D volumes from stored preview elements when session lacks siteVolumes */
export function synthesizeSiteVolumesFromElements(elements = []) {
  const blocks = elements.filter(
    (e) => e.material === 'Block reference' || (e.shape === 'cylinder' && e.height < 1),
  );
  const slabs = elements
    .filter((e) => e.type === 'slab' && e.area == null && e.size[0] > 1.2 && e.size[2] > 1.2)
    .slice(0, 40);

  const fromBlocks = blocks.slice(0, 80).map((e, i) => {
    const r = Math.max(e.size[0], e.size[2]) / 2;
    const h = Math.max(2.6, e.height * 18);
    return {
      id: `syn-block-${i}`,
      layer: e.sourceLayer || e.name,
      type: e.type,
      height: h,
      area: Math.PI * r * r,
      center: [e.position[0], h / 2, e.position[2]],
      shape: circleShape(Math.max(r, 0.5)),
    };
  });

  const fromSlabs = slabs.map((e, i) => {
    const [w, , d] = e.size;
    const h = Math.max(3.2, e.height * 14);
    const hw = w / 2;
    const hd = d / 2;
    return {
      id: `syn-slab-${i}`,
      layer: e.sourceLayer,
      type: 'slab',
      height: h,
      area: w * d,
      center: [e.position[0], h / 2, e.position[2]],
      shape: [
        { x: -hw, y: -hd },
        { x: hw, y: -hd },
        { x: hw, y: hd },
        { x: -hw, y: hd },
      ],
    };
  });

  return [...fromSlabs, ...fromBlocks];
}

function calculateBounds(segments, markers) {
  const points = [
    ...segments.flatMap((s) => [s.start, s.end]),
    ...markers.map((m) => m.center),
  ];
  if (!points.length) {
    throw new Error(
      'No drawable CAD geometry found. Try exploding blocks in AutoCAD (EXPLODE) then Save As AutoCAD 2013 DWG.',
    );
  }
  const xs = points.map((v) => v.x);
  const ys = points.map((v) => v.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function normalizeFactory(bounds) {
  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = TARGET_SCENE_SIZE / Math.max(width, height);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return {
    scale,
    normalize(value) {
      return { x: (value.x - centerX) * scale, z: (value.y - centerY) * scale };
    },
    toScene(raw) {
      return this.normalize(raw);
    },
  };
}

function segmentElement(segment, index, normalizer) {
  const start = normalizer.normalize(segment.start);
  const end = normalizer.normalize(segment.end);
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.max(Math.hypot(dx, dz), 0.02);
  const type = classifyEntity(segment.entity);
  const isHatch = segment.entity.type === 'HATCH' || segment.entity.type === 'HATCH_FILL';
  const thickness = isHatch ? 0.2 : type === 'wall' ? 0.1 : type === 'column' ? 0.12 : 0.04;
  const height = isHatch ? 0.12 : type === 'column' ? 0.5 : type === 'wall' ? 0.22 : 0.06;

  return {
    id: `cad-segment-${index}`,
    name: `${segment.entity.layer || 'CAD'} ${segment.entity.type}`,
    type,
    sourceLayer: segment.entity.layer || 'Unassigned',
    length: Math.round(length * 100) / 100,
    width: thickness,
    height,
    area: null,
    volume: null,
    material: 'Uploaded CAD entity',
    quantity: `${Math.round(length * 100) / 100} preview units`,
    cost: 0,
    position: [(start.x + end.x) / 2, height / 2, (start.z + end.z) / 2],
    size: [length, height, thickness],
    rotation: [0, -Math.atan2(dz, dx), 0],
    lineStart: [start.x, height, start.z],
    lineEnd: [end.x, height, end.z],
  };
}

function markerElement(marker, index, normalizer) {
  const center = normalizer.normalize(marker.center);
  const type = classifyEntity(marker.entity);
  const diameter = Math.max((marker.radius || 0.2) * normalizer.scale * 2, 0.12);
  const height = 0.15;
  return {
    id: `cad-marker-${index}`,
    name: marker.entity.name || `${marker.entity.layer || 'CAD'} ${marker.entity.type}`,
    type,
    sourceLayer: marker.entity.layer || 'Unassigned',
    length: diameter,
    width: diameter,
    height,
    material: 'Block reference',
    quantity: '1',
    cost: 0,
    position: [center.x, height / 2, center.z],
    size: [diameter, height, diameter],
    shape: 'box',
  };
}

function buildPreviewFromDatabase(database) {
  const { segments, markers, footprints } = flattenDatabaseGeometry(database);
  const bounds = calculateBounds(segments, markers);
  const normalizer = normalizeFactory(bounds);
  let siteVolumes = buildSiteVolumes(footprints, normalizer);
  if (siteVolumes.length < 15) {
    const markerVolumes = buildVolumesFromMarkers(markers, normalizer);
    const seen = new Set(siteVolumes.map((v) => `${v.layer}-${v.center[0].toFixed(1)}-${v.center[2].toFixed(1)}`));
    markerVolumes.forEach((v) => {
      const key = `${v.layer}-${v.center[0].toFixed(1)}-${v.center[2].toFixed(1)}`;
      if (!seen.has(key) && siteVolumes.length < 150) {
        seen.add(key);
        siteVolumes.push(v);
      }
    });
  }

  const buildingElements = [
    ...segments.map((segment, index) => segmentElement(segment, index, normalizer)),
    ...markers.map((marker, index) => markerElement(marker, index, normalizer)),
  ].slice(0, MAX_PREVIEW_ELEMENTS);

  const wireframeLines = segments.slice(0, MAX_PREVIEW_ELEMENTS).map((seg, i) => {
    const el = segmentElement(seg, i, normalizer);
    return {
      id: `line-${i}`,
      start: el.lineStart,
      end: el.lineEnd,
      layer: seg.entity.layer,
      type: classifyEntity(seg.entity),
    };
  });

  return {
    buildingElements,
    wireframeLines,
    siteVolumes,
    segments,
    footprints,
    markers,
    bounds,
    normalizer,
    segmentCount: segments.length,
    volumeCount: siteVolumes.length,
    entityCount: database.entities?.length ?? 0,
    drawingBounds: {
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      minX: bounds.minX,
      minY: bounds.minY,
    },
  };
}

async function loadLibreDwg() {
  const { LibreDwg, Dwg_File_Type } = await import('@mlightcad/libredwg-web');
  const libredwg = await LibreDwg.create(LIBREDWG_WASM_BASE);
  return { libredwg, Dwg_File_Type };
}

function yieldToMain() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const CAD_PARSE_TIMEOUT_MS = 120_000;

export async function extractCadPreview(file, options = {}) {
  const { onProgress } = options;
  const report = (step) => {
    if (typeof onProgress === 'function') onProgress(step);
  };
  const extension = getCadExtension(file.name);

  if (extension === 'dxf') {
    return {
      modelAvailable: false,
      cadParseError:
        'DXF preview is not enabled. Save as DWG (AutoCAD 2013 recommended) and upload again.',
    };
  }

  if (extension !== 'dwg') {
    return {
      modelAvailable: false,
      cadParseError: 'CAD preview needs a .dwg file.',
    };
  }

  const parseWork = async () => {
    report(0);
    const [{ libredwg, Dwg_File_Type }, fileContent] = await Promise.all([
      loadLibreDwg(),
      file.arrayBuffer(),
    ]);
    await yieldToMain();
    report(1);

    const data = libredwg.dwg_read_data(fileContent, Dwg_File_Type.DWG);
    if (!data) {
      return {
        modelAvailable: false,
        cadParseError:
          'LibreDWG could not read this DWG. Save As "AutoCAD 2013 DWG" in AutoCAD and re-upload.',
      };
    }

    let database;
    let unknownEntityCount = 0;
    let planSvg = null;
    try {
      if (typeof libredwg.convertEx === 'function') {
        const converted = libredwg.convertEx(data);
        database = converted.database;
        unknownEntityCount = converted.stats?.unknownEntityCount ?? 0;
      } else {
        database = libredwg.convert(data);
      }
      const entityCountPreview = database.entities?.length ?? 0;
      if (typeof libredwg.dwg_to_svg === 'function' && entityCountPreview < 2500) {
        try {
          planSvg = libredwg.dwg_to_svg(database);
        } catch {
          planSvg = null;
        }
      }
    } finally {
      libredwg.dwg_free(data);
    }

    await yieldToMain();
    report(2);

    const {
      buildingElements,
      wireframeLines,
      siteVolumes,
      segments,
      footprints,
      markers,
      bounds,
      normalizer,
      segmentCount,
      volumeCount,
      entityCount,
      drawingBounds,
    } = buildPreviewFromDatabase(database);

    await yieldToMain();
    report(3);

    const bimModel = reconstructBimModel({
      segments,
      footprints,
      markers,
      bounds,
      normalizer,
      fileName: file.name,
    });

    if (buildingElements.length === 0) {
      return {
        modelAvailable: false,
        cadParseError:
          'DWG opened but no geometry could be extracted. Use EXPLODE in AutoCAD on blocks, then save and re-upload.',
        cadPreviewMeta: { sourceEntityCount: entityCount, unknownEntityCount },
      };
    }

    return {
      modelAvailable: true,
      buildingElements,
      wireframeLines,
      siteVolumes,
      bimModel,
      planSvg,
      drawingBounds,
      cadPreviewMeta: {
        sourceEntityCount: entityCount,
        segmentCount,
        volumeCount,
        bimElementCount: bimModel.elements.length,
        bimFloorCount: bimModel.floors.length,
        renderedEntityCount: buildingElements.length,
        truncated: segmentCount > MAX_PREVIEW_ELEMENTS,
        unknownEntityCount,
        drawingWidth: drawingBounds.width,
        drawingHeight: drawingBounds.height,
        hasSvg: Boolean(planSvg),
      },
    };
  };

  try {
    return await Promise.race([
      parseWork(),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('CAD parsing took too long. Try a smaller DWG or AutoCAD 2013 format.')),
          CAD_PARSE_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const message = /error code:\s*68|VALUEOUTOFBOUNDS/i.test(raw)
      ? 'This DWG uses objects or a version LibreDWG cannot fully read (error 68). In AutoCAD use Save As → AutoCAD 2013 DWG, EXPLODE complex blocks, then re-upload.'
      : raw || 'Unable to parse this DWG file.';
    console.error('[DaiBoq] DWG preview failed:', error);
    return {
      modelAvailable: false,
      cadParseError: message,
    };
  }
}
