import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

export interface BOQSceneProps {
  mouse?: { x: number; y: number };
  scrollRotate?: number;
  className?: string;
}

/** Simple architectural floor-plan linework (plan coordinates) */
const WALL_SEGMENTS: [THREE.Vector3Tuple, THREE.Vector3Tuple][] = [
  [[-3.2, 0.07, -2.1], [3.2, 0.07, -2.1]],
  [[3.2, 0.07, -2.1], [3.2, 0.07, 2.1]],
  [[3.2, 0.07, 2.1], [-3.2, 0.07, 2.1]],
  [[-3.2, 0.07, 2.1], [-3.2, 0.07, -2.1]],
  [[-0.1, 0.07, -2.1], [-0.1, 0.07, 0.4]],
  [[-0.1, 0.07, 0.4], [1.8, 0.07, 0.4]],
  [[1.8, 0.07, 0.4], [1.8, 0.07, 2.1]],
  [[-2.4, 0.07, 0.2], [-0.1, 0.07, 0.2]],
  [[-2.4, 0.07, 0.2], [-2.4, 0.07, 1.6]],
  [[-2.4, 0.07, 1.6], [-0.1, 0.07, 1.6]],
  [[2.2, 0.07, -0.8], [3.2, 0.07, -0.8]],
  [[2.2, 0.07, -0.8], [2.2, 0.07, 0.6]],
  [[0.6, 0.07, -1.2], [0.6, 0.07, 0.4]],
];

const ROOM_FILLS: { pos: [number, number, number]; size: [number, number, number] }[] = [
  { pos: [-1.75, 0.04, -0.85], size: [2.3, 0.02, 2.5] },
  { pos: [2.5, 0.04, 0.65], size: [1.2, 0.02, 2.6] },
  { pos: [-2.2, 0.04, 0.9], size: [1.1, 0.02, 1.2] },
];

function MeasurementGrid({ size = 8 }: { size?: number }) {
  const ticks = useMemo(() => {
    const marks: [THREE.Vector3Tuple, THREE.Vector3Tuple][] = [];
    const step = 1;
    for (let i = -size / 2; i <= size / 2; i += step) {
      marks.push([[i, 0.02, -size / 2 - 0.15], [i, 0.02, -size / 2]]);
      marks.push([[i, 0.02, size / 2], [i, 0.02, size / 2 + 0.15]]);
      marks.push([[-size / 2 - 0.15, 0.02, i], [-size / 2, 0.02, i]]);
      marks.push([[size / 2, 0.02, i], [size / 2 + 0.15, 0.02, i]]);
    }
    return marks;
  }, [size]);

  return (
    <group>
      <gridHelper args={[size, size * 4, '#cbd5e1', '#e2e8f0']} position={[0, 0.01, 0]} />
      {ticks.map((pts, i) => (
        <Line key={i} points={pts} color="#94a3b8" lineWidth={1} transparent opacity={0.5} />
      ))}
    </group>
  );
}

function FloorPlanModel({ scrollRotate = 0 }: { scrollRotate?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = 0.28 + scrollRotate * 0.35;
    groupRef.current.rotation.x = -0.42 + scrollRotate * 0.08;
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      <mesh receiveShadow castShadow position={[0, 0, 0]}>
        <boxGeometry args={[7.2, 0.14, 5.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.08} />
      </mesh>
      {ROOM_FILLS.map((room, i) => (
        <mesh key={i} position={room.pos} receiveShadow>
          <boxGeometry args={room.size} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.5} metalness={0.02} />
        </mesh>
      ))}
      {WALL_SEGMENTS.map((pts, i) => (
        <Line key={i} points={pts} color="#64748b" lineWidth={2} />
      ))}
      <MeasurementGrid size={9} />
    </group>
  );
}

function CameraRig({
  mouse = { x: 0, y: 0 },
  scrollRotate = 0,
}: {
  mouse?: { x: number; y: number };
  scrollRotate?: number;
}) {
  const target = useRef(new THREE.Vector3(0, 0.2, 0));

  useFrame((state) => {
    const cam = state.camera;
    const tx = 5.5 + mouse.x * 1.4;
    const ty = 5.2 + mouse.y * 0.9 + scrollRotate * 0.5;
    const tz = 5.8 + mouse.x * 0.6;
    cam.position.lerp(new THREE.Vector3(tx, ty, tz), 0.06);
    cam.lookAt(target.current);
  });

  return null;
}

function SceneInner({
  mouse,
  scrollRotate,
}: {
  mouse: { x: number; y: number };
  scrollRotate: number;
}) {
  return (
    <>
      <color attach="background" args={['#f8fafc']} />
      <fog attach="fog" args={['#f1f5f9', 14, 28]} />
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 6, -2]} intensity={0.35} color="#c4b5fd" />
      <hemisphereLight intensity={0.4} groundColor="#e2e8f0" color="#ffffff" />
      <FloorPlanModel scrollRotate={scrollRotate} />
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={12} blur={2.5} far={8} />
      <Environment preset="city" />
      <CameraRig mouse={mouse} scrollRotate={scrollRotate} />
    </>
  );
}

export default function BOQScene({
  mouse = { x: 0, y: 0 },
  scrollRotate = 0,
  className = '',
}: BOQSceneProps) {
  return (
    <div className={`h-full w-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [5.5, 5.2, 5.8], fov: 42, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <SceneInner mouse={mouse} scrollRotate={scrollRotate} />
        </Suspense>
      </Canvas>
    </div>
  );
}
