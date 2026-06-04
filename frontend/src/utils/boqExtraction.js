import { boqItems as boqTemplate, quantityCalculations as qtyTemplate } from '../data/mockData';

const REFERENCE_FLOOR_AREA_M2 = 420;

/** Convert raw CAD drawing units to metres (heuristic). */
function cadUnitsToMetres(value) {
  if (!value || value <= 0) return 0;
  // Typical architectural DWG in mm
  if (value > 500) return value / 1000;
  return value;
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sumLength(elements, types) {
  return elements
    .filter((el) => types.includes(el.type))
    .reduce((sum, el) => sum + (Number(el.length) || 0), 0);
}

function countElements(elements, types) {
  return elements.filter((el) => types.includes(el.type)).length;
}

export function analyzeCadGeometry(cadResult) {
  const elements = cadResult?.buildingElements || [];
  const bounds = cadResult?.drawingBounds;

  let floorArea = 0;
  if (bounds?.width && bounds?.height) {
    const w = cadUnitsToMetres(bounds.width);
    const h = cadUnitsToMetres(bounds.height);
    floorArea = w * h;
  }

  const wallLikeLength = sumLength(elements, ['wall', 'cad']);
  const columnCount = countElements(elements, ['column']);
  const doorCount = Math.max(countElements(elements, ['door']), 1);
  const windowCount = Math.max(countElements(elements, ['window']), 1);
  const slabCount = countElements(elements, ['slab', 'roof']);

  if (floorArea < 20 && wallLikeLength > 0) {
    const perimeterGuess = wallLikeLength * 2.5;
    floorArea = Math.max((perimeterGuess / 4) ** 2, 80);
  }

  if (floorArea < 20) {
    floorArea = REFERENCE_FLOOR_AREA_M2 * Math.min(1, elements.length / 120);
  }

  const wallArea = round(Math.max(floorArea * 2.8, wallLikeLength * 3.2), 0);
  const concreteVolume = round(floorArea * 0.12 + columnCount * 0.27 + slabCount * 18, 1);
  const steelQuantity = round(concreteVolume * 0.083, 1);
  const brickQuantity = Math.ceil(wallArea * 55 * 1.05);
  const tileQuantity = Math.ceil(floorArea * 0.92);
  const paintQuantity = Math.ceil((wallArea * 2) / 12);

  return {
    floorArea: round(floorArea, 0),
    wallArea,
    concreteVolume,
    steelQuantity,
    brickQuantity,
    tileQuantity,
    paintQuantity,
    doorCount: Math.max(doorCount, Math.ceil(floorArea / 80)),
    windowCount: Math.max(windowCount, Math.ceil(floorArea / 45)),
    scaleFactor: floorArea / REFERENCE_FLOOR_AREA_M2,
    elementCount: elements.length,
  };
}

function scaleBoqItems(analysis, fileName) {
  const scale = Math.max(0.35, Math.min(2.5, analysis.scaleFactor || 1));

  const items = boqTemplate.map((item, index) => {
    let quantity = item.quantity;
    const desc = item.description.toLowerCase();

    if (item.category === 'Earthwork') quantity = round(item.quantity * scale, 0);
    else if (item.category === 'Concrete') quantity = round(item.quantity * scale, 1);
    else if (item.category === 'Steel') quantity = round(analysis.steelQuantity * (item.quantity / qtyTemplate.steelQuantity), 1);
    else if (item.category === 'Masonry') quantity = analysis.wallArea;
    else if (item.category === 'Plaster') quantity = round(analysis.wallArea * 2, 0);
    else if (item.category === 'Flooring') quantity = analysis.tileQuantity;
    else if (item.category === 'Painting' && desc.includes('internal')) quantity = round(analysis.wallArea * 2, 0);
    else if (item.category === 'Painting') quantity = round(analysis.wallArea * 0.5, 0);
    else if (item.category === 'Doors') quantity = analysis.doorCount;
    else if (item.category === 'Windows') quantity = analysis.windowCount;
    else if (item.category === 'Roofing') quantity = round(analysis.floorArea * 0.9, 0);
    else quantity = round(item.quantity * scale, 1);

    const amount = Math.round(quantity * item.rate);
    return {
      ...item,
      id: index + 1,
      quantity,
      amount,
      description: item.description,
    };
  });

  return items;
}

/**
 * Build BOQ rows and quantities from a successful CAD parse (client-side extraction).
 */
export function extractBoqFromCad(cadResult, fileName = '') {
  if (!cadResult?.modelAvailable || !cadResult.buildingElements?.length) {
    return {
      extractionAvailable: false,
      status: 'UPLOADED_AWAITING_EXTRACTION',
    };
  }

  const analysis = analyzeCadGeometry(cadResult);
  const boqItems = scaleBoqItems(analysis, fileName);

  const quantities = {
    wallArea: analysis.wallArea,
    floorArea: analysis.floorArea,
    concreteVolume: analysis.concreteVolume,
    brickQuantity: analysis.brickQuantity,
    paintQuantity: analysis.paintQuantity,
    tileQuantity: analysis.tileQuantity,
    steelQuantity: analysis.steelQuantity,
  };

  return {
    extractionAvailable: true,
    status: 'EXTRACTED',
    quantities,
    boqItems,
    message: `BOQ generated from ${cadResult.buildingElements.length} CAD entities (${fileName || 'drawing'}).`,
    extractionMeta: {
      source: 'client-cad-parser',
      scaleFactor: round(analysis.scaleFactor, 2),
      elementCount: analysis.elementCount,
    },
  };
}
