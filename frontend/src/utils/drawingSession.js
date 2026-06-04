import {
  loadDrawingGeometry,
  pruneDrawingGeometry,
  saveDrawingGeometry,
} from './drawingGeometryStore';

const STORAGE_KEY = 'daiboq.latestDrawing';
const LEGACY_STORAGE_KEY = 'boqmind.latestDrawing';

const HEAVY_KEYS = [
  'buildingElements',
  'wireframeLines',
  'siteVolumes',
  'bimModel',
  'planSvg',
];

function hasHeavyPayload(source) {
  return HEAVY_KEYS.some((key) => {
    const value = source[key];
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  });
}

function splitDrawingPayload(result, fileName) {
  const heavy = {};
  for (const key of HEAVY_KEYS) {
    if (result[key] != null) heavy[key] = result[key];
  }

  const summary = {
    fileName: result.fileName || fileName,
    fileType: (fileName || '').split('.').pop()?.toLowerCase() || '',
    uploadedAt: new Date().toISOString(),
    mock: Boolean(result.mock),
    status: result.status || 'UPLOADED_AWAITING_EXTRACTION',
    extractionAvailable: result.extractionAvailable === true,
    modelAvailable: result.modelAvailable === true,
    quantities: result.quantities || null,
    boqItems: result.boqItems || null,
    drawingBounds: result.drawingBounds || null,
    cadPreviewMeta: result.cadPreviewMeta || null,
    cadParseError: result.cadParseError || null,
    extractionMeta: result.extractionMeta || null,
    serverUploadFailed: result.serverUploadFailed === true,
    geometryId: null,
  };

  return { summary, heavy, hasHeavy: hasHeavyPayload(heavy) };
}

function readSummaryRaw() {
  try {
    const current = sessionStorage.getItem(STORAGE_KEY);
    if (current) return JSON.parse(current);

    const legacy = sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return null;

    const parsed = JSON.parse(legacy);
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    return parsed;
  } catch {
    return null;
  }
}

function writeSummary(summary) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
}

async function attachGeometry(summary) {
  if (!summary) return null;

  if (summary.geometryId) {
    try {
      const heavy = await loadDrawingGeometry(summary.geometryId);
      if (heavy) return { ...summary, ...heavy };
    } catch {
      console.warn('[DaiBoq] IndexedDB load failed, geometry data unavailable');
    }
    return null;
  }

  if (hasHeavyPayload(summary)) {
    return migrateInlineToIndexedDb(summary);
  }

  return summary;
}

async function migrateInlineToIndexedDb(inline) {
  const geometryId = crypto.randomUUID();
  const heavy = {};
  for (const key of HEAVY_KEYS) {
    if (inline[key] != null) heavy[key] = inline[key];
  }

  await saveDrawingGeometry(geometryId, heavy);
  await pruneDrawingGeometry(geometryId);

  const summary = { ...inline };
  for (const key of HEAVY_KEYS) delete summary[key];
  summary.geometryId = geometryId;
  writeSummary(summary);

  return { ...summary, ...heavy };
}

/**
 * Persist latest drawing: metadata in sessionStorage, large CAD blobs in IndexedDB.
 */
export async function saveLatestDrawing(file, result = {}) {
  const { summary, heavy, hasHeavy } = splitDrawingPayload(result, file?.name);

  if (hasHeavy) {
    const geometryId = crypto.randomUUID();
    await saveDrawingGeometry(geometryId, heavy);
    await pruneDrawingGeometry(geometryId);
    summary.geometryId = geometryId;
  }

  try {
    writeSummary(summary);
  } catch (error) {
    if (summary.boqItems?.length) {
      summary.boqItems = summary.boqItems.slice(0, 50);
      writeSummary(summary);
    } else {
      throw error;
    }
  }

  return hasHeavy ? { ...summary, ...heavy } : summary;
}

export async function getLatestDrawing() {
  const summary = readSummaryRaw();
  if (!summary) return null;
  return attachGeometry(summary);
}

export async function patchLatestDrawing(patch) {
  const current = await getLatestDrawing();
  if (!current) return null;

  const updated = { ...current, ...patch };
  const fileName = updated.fileName || 'drawing';
  return saveLatestDrawing({ name: fileName }, updated);
}
