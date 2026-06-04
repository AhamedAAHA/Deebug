const FINISH_CATEGORIES = ['Plaster', 'Flooring', 'Painting'];

function lineKey(item) {
  return `${item.category}::${item.description}`;
}

function totalCost(items = []) {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
}

function quantityLabel(q) {
  if (!q) return '—';
  return [
    q.floorArea != null && `Floor ${q.floorArea} m²`,
    q.concreteVolume != null && `Concrete ${q.concreteVolume} m³`,
    q.brickQuantity != null && `Bricks ${q.brickQuantity}`,
    q.steelQuantity != null && `Steel ${q.steelQuantity} MT`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Compare two drawing upload results (V1 vs V2) into cost summary + change rows.
 */
export function compareDrawingRevisions(v1, v2) {
  const items1 = v1?.boqItems || [];
  const items2 = v2?.boqItems || [];
  const version1Cost = totalCost(items1);
  const version2Cost = totalCost(items2);
  const netChange = version2Cost - version1Cost;
  const percentChange = version1Cost > 0 ? (netChange / version1Cost) * 100 : 0;

  const map1 = new Map(items1.map((item) => [lineKey(item), item]));
  const map2 = new Map(items2.map((item) => [lineKey(item), item]));
  const changes = [];

  for (const [key, after] of map2) {
    const before = map1.get(key);
    if (!before) {
      changes.push({
        type: 'added',
        element: after.category,
        detail: `Added: ${after.description} (${after.quantity} ${after.unit})`,
        impact: after.amount,
      });
      continue;
    }
    const qtyDelta = (after.quantity || 0) - (before.quantity || 0);
    const impact = (after.amount || 0) - (before.amount || 0);
    if (Math.abs(qtyDelta) > 0.01 || Math.abs(impact) > 1) {
      changes.push({
        type: 'modified',
        element: after.category,
        detail: `${after.description}: qty ${before.quantity} → ${after.quantity} ${after.unit}`,
        impact,
      });
    }
  }

  for (const [key, before] of map1) {
    if (!map2.has(key)) {
      changes.push({
        type: 'removed',
        element: before.category,
        detail: `Removed: ${before.description}`,
        impact: -(before.amount || 0),
      });
    }
  }

  const q1 = v1?.quantities;
  const q2 = v2?.quantities;
  if (q1 && q2) {
    if (Math.abs((q2.floorArea || 0) - (q1.floorArea || 0)) > 1) {
      changes.unshift({
        type: 'modified',
        element: 'Floor area',
        detail: `Floor area ${q1.floorArea} m² → ${q2.floorArea} m²`,
        impact: Math.round((q2.floorArea - q1.floorArea) * 850),
      });
    }
    if (Math.abs((q2.concreteVolume || 0) - (q1.concreteVolume || 0)) > 0.5) {
      changes.unshift({
        type: 'modified',
        element: 'Concrete',
        detail: `Concrete volume ${q1.concreteVolume} m³ → ${q2.concreteVolume} m³`,
        impact: Math.round((q2.concreteVolume - q1.concreteVolume) * 8800),
      });
    }
  }

  if (!changes.length && (v1?.fileName || v2?.fileName)) {
    changes.push({
      type: 'modified',
      element: 'Drawing revision',
      detail: `${v1?.fileName || 'Version 1'} → ${v2?.fileName || 'Version 2'}. ${quantityLabel(q1)} vs ${quantityLabel(q2)}`,
      impact: netChange,
    });
  }

  changes.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return {
    version1Cost,
    version2Cost,
    netChange,
    percentChange,
    changes,
    hasBoq: items1.length > 0 || items2.length > 0,
  };
}
