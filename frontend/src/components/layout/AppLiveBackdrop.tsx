import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, RoundedBox, Sparkles } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function AmbientModel() {
  const rig = useRef<THREE.Group>(null);
  const points = useMemo(
    () => [
      [-2.6, 0.9, 0],
      [-0.7, -0.5, 0],
      [1.5, 0.35, 0],
      [3.1, -0.9, 0],
    ] as THREE.Vector3Tuple[],
    [],
  );

  useFrame(({ clock, mouse }) => {
    if (!rig.current) return;
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, mouse.x * 0.12 + clock.elapsedTime * 0.05, 0.03);
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, -mouse.y * 0.08, 0.03);
  });

  return (
    <group ref={rig} position={[1.6, 0, 0]}>
      {points.map((point, index) => (
        <Float key={index} speed={0.8 + index * 0.12} floatIntensity={0.35} rotationIntensity={0.25}>
          <group position={point}>
            <RoundedBox args={[0.38, 0.38, 0.38]} radius={0.07} smoothness={5} rotation={[0.2, 0.4, Math.PI / 4]}>
              <meshPhysicalMaterial color="#ffffff" transparent opacity={0.52} roughness={0.2} transmission={0.08} clearcoat={1} />
            </RoundedBox>
            <mesh>
              <sphereGeometry args={[0.055, 20, 20]} />
              <meshStandardMaterial color="#8174f4" emissive="#8174f4" emissiveIntensity={1.1} />
            </mesh>
          </group>
        </Float>
      ))}
      {points.slice(0, -1).map((point, index) => (
        <Line key={index} points={[point, points[index + 1]]} color="#9aa7ff" lineWidth={1} transparent opacity={0.2} />
      ))}
      <Sparkles count={30} scale={[7, 3.4, 2]} size={1.3} speed={0.22} color="#a8b1ff" opacity={0.36} />
    </group>
  );
}

export default function AppLiveBackdrop() {
  return (
    <div className="app-live-backdrop" aria-hidden="true">
      <Canvas
        dpr={[1, 1.35]}
        camera={{ position: [0, 0, 6.5], fov: 42, near: 0.1, far: 24 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 4, 5]} intensity={1.6} />
        <pointLight position={[-2, 1, 2]} color="#8174f4" intensity={2.4} />
        <AmbientModel />
      </Canvas>
    </div>
  );
}
