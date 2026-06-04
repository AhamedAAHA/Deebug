import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';

const TYPE_COLORS = {
  slab: '#8fb2ff',
  wall: '#c6ccd8',
  column: '#9c8cff',
  door: '#dba16a',
  window: '#83dcd3',
  roof: '#9aa5b5',
  cad: '#7f8bff',
};

function SitePad() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
      <circleGeometry args={[14, 64]} />
      <meshStandardMaterial color="#eef3fb" metalness={0.05} roughness={0.82} transparent opacity={0.42} />
    </mesh>
  );
}

function ExtrudedVolume({ volume, assembleProgress, selected, onSelect }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const color = TYPE_COLORS[volume.type] || '#0ea5e9';
  const isRoad = volume.height < 0.5;

  const geometry = useMemo(() => {
    if (!volume.shape?.length || volume.shape.length < 3) return null;
    const shape = new THREE.Shape();
    volume.shape.forEach((p, i) => {
      if (i === 0) shape.moveTo(p.x, p.y);
      else shape.lineTo(p.x, p.y);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(volume.height, 0.15),
      bevelEnabled: volume.height > 0.55 && !isRoad,
      bevelThickness: Math.min(0.1, volume.height * 0.06),
      bevelSize: Math.min(0.08, volume.height * 0.05),
      bevelSegments: 2,
    });
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
  }, [volume, isRoad]);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = assembleProgress ?? 1;
    groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, target, 0.1);
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef} position={[volume.center[0], 0, volume.center[2]]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        castShadow={!isRoad}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.({
            id: volume.id,
            name: `${volume.layer || 'Volume'} (${volume.type})`,
            type: volume.type,
            sourceLayer: volume.layer,
            length: Math.round(volume.area * 10) / 10,
            height: volume.height,
            material: 'Extruded from CAD hatch / boundary',
            quantity: `${volume.area.toFixed(1)} m² footprint`,
            cost: 0,
          });
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={selected ? '#7c6df4' : isRoad ? '#e7ecf6' : '#f8faff'}
          emissiveIntensity={selected ? 0.55 : isRoad ? 0.02 : 0.08}
          metalness={isRoad ? 0.05 : 0.22}
          roughness={isRoad ? 0.9 : 0.58}
          transparent={volume.type === 'cad' || isRoad}
          opacity={isRoad ? 0.55 : volume.type === 'cad' ? 0.82 : 0.94}
        />
        <Edges threshold={15} color={selected ? '#7c6df4' : '#c6cde0'} />
      </mesh>
    </group>
  );
}

function WallBar({ line, assembleProgress }) {
  const { start, end, type } = line;
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const len = Math.max(Math.hypot(dx, dz), 0.05);
  const height = type === 'wall' ? 2.8 : type === 'column' ? 3.5 : 1.4;
  const thickness = type === 'wall' ? 0.14 : 0.09;
  const progress = assembleProgress ?? 1;
  const midY = (height / 2) * progress;

  return (
    <mesh
      position={[(start[0] + end[0]) / 2, midY, (start[2] + end[2]) / 2]}
      rotation={[0, -Math.atan2(dz, dx), 0]}
      scale={[1, progress, 1]}
      castShadow
    >
      <boxGeometry args={[len, height, thickness]} />
      <meshStandardMaterial
        color={TYPE_COLORS[type] || '#94a3b8'}
        metalness={0.25}
        roughness={0.65}
        transparent
        opacity={0.88}
      />
      <Edges threshold={20} color="#c6cde0" />
    </mesh>
  );
}

export default function SiteVolumes({
  volumes = [],
  wallLines = [],
  assembleProgress = 1,
  selectedId,
  onSelect,
}) {
  const wallSample = useMemo(() => {
    if (volumes.length > 8) return [];
    const walls = wallLines.filter((l) => l.type === 'wall' || l.type === 'slab');
    const step = Math.max(1, Math.floor(walls.length / 280));
    return walls.filter((_, i) => i % step === 0).slice(0, 280);
  }, [wallLines, volumes.length]);

  return (
    <group>
      <SitePad />
      {volumes.map((vol) => (
        <ExtrudedVolume
          key={vol.id}
          volume={vol}
          assembleProgress={assembleProgress}
          selected={selectedId === vol.id}
          onSelect={onSelect}
        />
      ))}
      {wallSample.map((line) => (
        <WallBar key={line.id} line={line} assembleProgress={assembleProgress} />
      ))}
    </group>
  );
}
