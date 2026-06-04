import { useMemo } from 'react';
import * as THREE from 'three';

const TYPE_COLORS = {
  slab: '#0ea5e9',
  wall: '#94a3b8',
  column: '#818cf8',
  door: '#d97706',
  window: '#22d3ee',
  roof: '#475569',
  cad: '#67e8f9',
};

export default function PlanWireframe({ lines = [], color = '#67e8f9' }) {
  const geometry = useMemo(() => {
    if (!lines.length) return null;
    const positions = new Float32Array(lines.length * 6);
    lines.forEach((line, i) => {
      const o = i * 6;
      positions[o] = line.start[0];
      positions[o + 1] = line.start[1] ?? 0.05;
      positions[o + 2] = line.start[2];
      positions[o + 3] = line.end[0];
      positions[o + 4] = line.end[1] ?? 0.05;
      positions[o + 5] = line.end[2];
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [lines]);

  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.9} />
    </lineSegments>
  );
}

export function PlanWireframeByType({ lines = [] }) {
  const groups = useMemo(() => {
    const map = {};
    lines.forEach((line) => {
      const t = line.type || 'cad';
      if (!map[t]) map[t] = [];
      map[t].push(line);
    });
    return map;
  }, [lines]);

  return (
    <group>
      {Object.entries(groups).map(([type, groupLines]) => (
        <PlanWireframe key={type} lines={groupLines} color={TYPE_COLORS[type]} />
      ))}
    </group>
  );
}
