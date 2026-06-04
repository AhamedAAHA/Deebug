import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

export default function SvgPlanFloor({ svg, size = 30, opacity = 0.92 }) {
  const texture = useMemo(() => {
    if (!svg) return null;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const tex = new THREE.TextureLoader().load(url, () => URL.revokeObjectURL(url));
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [svg]);

  useEffect(() => () => texture?.dispose(), [texture]);

  if (!texture || !Number.isFinite(size) || size <= 0) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}
