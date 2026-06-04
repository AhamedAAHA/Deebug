import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, RoundedBox, Sparkles } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

type HeroLiveSceneProps = {
  pointer?: { x: number; y: number };
};

function GlowMaterial({ color, emissive = color, opacity = 1 }: { color: string; emissive?: string; opacity?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={0.55}
      transparent={opacity < 1}
      opacity={opacity}
      roughness={0.22}
      metalness={0.08}
    />
  );
}

function BuildingMass({
  position,
  size,
  color = '#f4f7fb',
}: {
  position: THREE.Vector3Tuple;
  size: THREE.Vector3Tuple;
  color?: string;
}) {
  return (
    <RoundedBox args={size} radius={0.045} smoothness={5} position={position} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.2} metalness={0.06} clearcoat={1} clearcoatRoughness={0.08} />
    </RoundedBox>
  );
}

function QuantityPin({ position, color }: { position: THREE.Vector3Tuple; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.08, 24, 24]} />
        <GlowMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.42, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.65} />
      </mesh>
      <pointLight color={color} intensity={1.1} distance={2.2} />
    </group>
  );
}

function HeroBimModel({ pointer = { x: 0, y: 0 } }: HeroLiveSceneProps) {
  const rig = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const pins = useMemo(
    () => [
      [-1.35, 0.95, -0.72] as THREE.Vector3Tuple,
      [0.4, 1.22, -0.48] as THREE.Vector3Tuple,
      [1.45, 0.78, 0.54] as THREE.Vector3Tuple,
      [-0.58, 0.72, 0.86] as THREE.Vector3Tuple,
    ],
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (rig.current) {
      rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, -0.34 + pointer.y * 0.12, 0.045);
      rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, -0.48 + pointer.x * 0.2 + Math.sin(t * 0.18) * 0.08, 0.045);
      rig.current.position.y = Math.sin(t * 0.55) * 0.06;
    }
    if (scan.current) {
      scan.current.position.z = -1.35 + ((t * 0.45) % 2.7);
    }
  });

  return (
    <group ref={rig}>
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[4.35, 0.08, 2.9]} />
        <meshPhysicalMaterial color="#eef2f6" roughness={0.22} metalness={0.08} clearcoat={1} />
      </mesh>

      <group position={[0, 0.02, 0]}>
        {[
          [[-1.45, 0.2, -0.82], [1.35, 0.36, 0.08]],
          [[0.1, 0.2, -0.82], [1.08, 0.36, 0.08]],
          [[1.34, 0.2, -0.02], [1.08, 0.36, 0.08]],
          [[-1.45, 0.2, 0.72], [1.35, 0.36, 0.08]],
          [[-0.62, 0.2, 0.04], [0.08, 0.36, 1.42]],
          [[0.78, 0.2, 0.34], [0.08, 0.36, 1.04]],
        ].map(([position, size], index) => (
          <BuildingMass key={index} position={position as THREE.Vector3Tuple} size={size as THREE.Vector3Tuple} />
        ))}

        {[
          [-1.6, 0.58, -0.92],
          [1.6, 0.58, -0.92],
          [-1.6, 0.58, 0.92],
          [1.6, 0.58, 0.92],
          [0.04, 0.58, 0.92],
        ].map((position, index) => (
          <BuildingMass key={`column-${index}`} position={position as THREE.Vector3Tuple} size={[0.16, 1.04, 0.16]} color="#dde5ef" />
        ))}

        <BuildingMass position={[-0.28, 1.1, -0.28]} size={[2.75, 0.1, 1.8]} color="#ffffff" />
        <BuildingMass position={[0.52, 1.82, -0.2]} size={[1.35, 1.3, 1.02]} color="#f6f8fb" />
        <BuildingMass position={[-0.88, 1.55, 0.42]} size={[0.95, 0.86, 0.82]} color="#edf3f8" />
      </group>

      <mesh ref={scan} position={[0, 1.12, -1.2]}>
        <boxGeometry args={[4.6, 0.018, 0.08]} />
        <meshBasicMaterial color="#35e7ff" transparent opacity={0.58} />
      </mesh>

      <Line points={[[-2.2, 0.04, -1.45], [2.2, 0.04, -1.45], [2.2, 0.04, 1.45], [-2.2, 0.04, 1.45], [-2.2, 0.04, -1.45]]} color="#9fb4ff" lineWidth={1} transparent opacity={0.35} />
      <Line points={[[-2.05, 1.2, -1.3], [-0.7, 1.8, -0.5], [0.2, 2.1, 0.2], [1.72, 1.35, 1.05]]} color="#35e7ff" lineWidth={1} transparent opacity={0.34} />

      {pins.map((position, index) => (
        <QuantityPin key={index} position={position} color={index % 2 ? '#8a7dff' : '#35e7ff'} />
      ))}

      <Sparkles count={50} scale={[5.8, 3.7, 3.2]} size={1.45} speed={0.22} color="#dfe6ff" opacity={0.48} />
    </group>
  );
}

export default function HeroLiveScene({ pointer = { x: 0, y: 0 } }: HeroLiveSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [0, 1.3, 6.4], fov: 35, near: 0.1, far: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[4.5, 6.2, 5.4]} intensity={3.1} castShadow />
      <pointLight position={[-3, 2.4, 2]} color="#8a7dff" intensity={4.2} />
      <pointLight position={[3, -1.2, 2]} color="#35e7ff" intensity={3.2} />
      <Float speed={0.75} floatIntensity={0.18} rotationIntensity={0.06}>
        <HeroBimModel pointer={pointer} />
      </Float>
    </Canvas>
  );
}
