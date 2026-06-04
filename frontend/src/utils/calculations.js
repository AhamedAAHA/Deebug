import { quantityCalculations } from '../data/mockData';

export function calculateWallArea(length, height, count = 1) {
  return length * height * count;
}

export function calculateConcreteVolume(length, width, depth) {
  return length * width * depth;
}

export function calculateBrickQuantity(wallAreaM2, wallThicknessMm = 230) {
  const bricksPerM2 = wallThicknessMm === 230 ? 55 : 45;
  return Math.ceil(wallAreaM2 * bricksPerM2 * 1.05);
}

export function calculatePaintQuantity(wallAreaM2, coats = 2, coveragePerLiter = 12) {
  return Math.ceil((wallAreaM2 * coats) / coveragePerLiter);
}

export function calculateTileQuantity(floorAreaM2, wastage = 0.08) {
  return Math.ceil(floorAreaM2 * (1 + wastage));
}

export function calculateSteelWeight(concreteVolumeM3, kgPerM3 = 80) {
  return (concreteVolumeM3 * kgPerM3) / 1000;
}

export function getAssistantAnswer(query) {
  const q = query.toLowerCase();
  if (q.includes('brick')) return 'bricks';
  if (q.includes('concrete') || q.includes('volume')) return 'concrete';
  if (q.includes('cost') || q.includes('estimate') || q.includes('price')) return 'cost';
  if (q.includes('steel') || q.includes('rebar') || q.includes('reinforcement')) return 'steel';
  if (q.includes('paint')) return 'paint';
  return 'default';
}

export function recalculateBoqTotal(items) {
  return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

export function recalculateMaterialCost(prices) {
  return prices.reduce((sum, m) => sum + m.rate * m.usage, 0);
}

export function getQuantitySnapshot() {
  return { ...quantityCalculations };
}

export function analyzeContractors(quotes) {
  if (!quotes.length) return null;
  const scored = quotes.map((q) => {
    const priceScore = 100 - (q.price / Math.max(...quotes.map((x) => x.price))) * 40;
    const timeScore = 100 - (q.deliveryDays / Math.max(...quotes.map((x) => x.deliveryDays))) * 25;
    const qualityScore = q.qualityScore;
    const riskPenalty = q.riskScore * 0.3;
    const total = priceScore * 0.35 + timeScore * 0.2 + qualityScore * 0.35 - riskPenalty;
    return { ...q, totalScore: Math.round(total) };
  });
  scored.sort((a, b) => b.totalScore - a.totalScore);
  return scored;
}

export function calculateSustainability(materials) {
  const cement = materials.find((m) => m.id === 'cement');
  const bricks = materials.find((m) => m.id === 'bricks');
  const carbon = (cement?.usage || 0) * 0.04 + (bricks?.usage || 0) * 0.00012;
  return {
    carbonFootprint: Math.round(carbon * 10) / 10,
    score: Math.max(40, Math.min(95, 100 - carbon * 0.15)),
  };
}
