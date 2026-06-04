import * as THREE from 'three';

const cache = new Map();

function mat(key, props) {
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial(props);
  cache.set(key, m);
  return m;
}

export function getBimMaterial(name, { wireframe = false, transparent = false, opacity = 1, colorOverride } = {}) {
  const base = {
    wireframe,
    transparent: transparent || opacity < 1,
    opacity,
    side: THREE.DoubleSide,
  };

  const presets = {
    concrete: { color: '#b8bcc4', roughness: 0.82, metalness: 0.05, ...base },
    brick: { color: '#c4785a', roughness: 0.88, metalness: 0.02, ...base },
    steel: { color: '#6b7280', roughness: 0.35, metalness: 0.75, ...base },
    glass: { color: '#7dd3fc', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.45, ...base },
    tile: { color: '#e7e5e4', roughness: 0.55, metalness: 0.1, ...base },
    asphalt: { color: '#374151', roughness: 0.92, metalness: 0.02, ...base },
    paint: { color: '#f1f5f9', roughness: 0.7, metalness: 0.05, ...base },
  };

  const p = presets[name] || presets.concrete;
  if (colorOverride) p.color = colorOverride;
  return mat(`${name}-${wireframe}-${opacity}-${colorOverride || ''}`, p);
}

export function heatmapMaterial(hex, { wireframe = false, opacity = 0.92 } = {}) {
  return mat(`heat-${hex}`, {
    color: hex,
    roughness: 0.65,
    metalness: 0.15,
    wireframe,
    transparent: opacity < 1,
    opacity,
  });
}
