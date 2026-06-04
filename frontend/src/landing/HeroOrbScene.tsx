import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

type HeroOrbSceneProps = {
  pointer?: { x: number; y: number };
};

function OrbCore() {
  const mesh = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.LineSegments>(null);

  const wireGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.05, 2);
    return new THREE.WireframeGeometry(geo);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (mesh.current) {
      mesh.current.rotation.y = t * 0.22;
      mesh.current.rotation.x = Math.sin(t * 0.35) * 0.12;
    }
    if (wire.current) {
      wire.current.rotation.y = -t * 0.18;
      wire.current.rotation.z = t * 0.08;
    }
  });

  return (
    <group>
      <mesh ref={mesh} castShadow>
        <icosahedronGeometry args={[1.02, 1]} />
        <meshPhysicalMaterial
          color="#1a4a5c"
          emissive="#35e7ff"
          emissiveIntensity={0.85}
          roughness={0.15}
          metalness={0.35}
          transparent
          opacity={0.92}
          clearcoat={1}
        />
      </mesh>
      <lineSegments ref={wire} geometry={wireGeometry}>
        <lineBasicMaterial color="#8af4ff" transparent opacity={0.55} />
      </lineSegments>
    </group>
  );
}

function OrbitRing({
  radius,
  color,
  rotation,
  speed,
}: {
  radius: number;
  color: string;
  rotation: THREE.EulerTuple;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = clock.elapsedTime * speed;
  });

  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, 0.012, 12, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.75} />
    </mesh>
  );
}

function Scene({ pointer = { x: 0, y: 0 } }: HeroOrbSceneProps) {
  const rig = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!rig.current) return;
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, pointer.x * 0.35, 0.04);
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, pointer.y * 0.18, 0.04);
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 3, 4]} intensity={12} color="#35e7ff" />
      <pointLight position={[-4, -2, 2]} intensity={8} color="#8a7dff" />
      <directionalLight position={[0, 5, 2]} intensity={2.5} color="#e0f2fe" />

      <group ref={rig}>
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.35}>
          <OrbCore />
          <OrbitRing radius={1.55} color="#35e7ff" rotation={[Math.PI / 2.8, 0, 0]} speed={0.35} />
          <OrbitRing radius={1.85} color="#8a7dff" rotation={[Math.PI / 3.2, 0.6, 0.2]} speed={-0.28} />
        </Float>
        <Sparkles count={80} scale={5.5} size={2} speed={0.25} color="#c8f7ff" opacity={0.45} />
      </group>
    </>
  );
}

export default function HeroOrbScene({ pointer = { x: 0, y: 0 } }: HeroOrbSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.8], fov: 42, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene pointer={pointer} />
    </Canvas>
  );
}
