import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const CYAN = '#35e7ff';
const BLUE = '#4b8cff';
const INDIGO = '#8a7dff';

const WORKFLOW_NODES = [
  { label: 'Upload', color: CYAN, angle: 0 },
  { label: 'Extract', color: BLUE, angle: Math.PI * 0.5 },
  { label: 'Estimate', color: INDIGO, angle: Math.PI },
  { label: 'Deliver', color: CYAN, angle: Math.PI * 1.5 },
];

function WorkflowNode({ angle, color, radius }: { angle: number; color: string; radius: number }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.35 + angle;
    ref.current.position.set(Math.cos(t) * radius, 0.55 + Math.sin(t * 2) * 0.06, Math.sin(t) * radius);
    ref.current.rotation.y = -t;
  });

  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.85} metalness={0.35} roughness={0.12} clearcoat={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.008, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

function ProjectCore() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.12;
  });

  return (
    <group ref={ref} position={[0, 0.08, 0]}>
      <RoundedBox args={[2.4, 0.14, 1.65]} radius={0.1} smoothness={8} castShadow receiveShadow>
        <meshPhysicalMaterial color="#1e293b" emissive="#0f172a" emissiveIntensity={0.35} roughness={0.18} metalness={0.2} clearcoat={1} />
      </RoundedBox>
      {[
        [-0.65, 0.22, -0.35],
        [0.55, 0.22, -0.4],
        [0.15, 0.22, 0.45],
      ].map((pos, i) => (
        <RoundedBox key={i} args={[0.75, 0.18, 0.55]} radius={0.04} position={pos as THREE.Vector3Tuple} castShadow>
          <meshPhysicalMaterial color="#334155" emissive={CYAN} emissiveIntensity={0.2} roughness={0.15} clearcoat={1} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.55, 16]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function FlowLinks() {
  const links = useMemo(() => {
    const radius = 1.65;
    return WORKFLOW_NODES.map(({ angle }) => {
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return [
        [0, 0.35, 0] as THREE.Vector3Tuple,
        [x * 0.55, 0.45, z * 0.55] as THREE.Vector3Tuple,
        [x, 0.55, z] as THREE.Vector3Tuple,
      ];
    });
  }, []);

  return (
    <group>
      {links.map((points, i) => (
        <Line key={i} points={points} color={WORKFLOW_NODES[i].color} lineWidth={1.4} transparent opacity={0.55} />
      ))}
    </group>
  );
}

function Scene() {
  const rig = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!rig.current) return;
    rig.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.18;
  });

  return (
    <>
      <color attach="background" args={['#090d1a']} />
      <fog attach="fog" args={['#090d1a', 6, 14]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight intensity={0.5} color="#c8f7ff" groundColor="#0f172a" />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#f0f9ff" castShadow />
      <pointLight position={[-2, 2, 2]} intensity={4} color={INDIGO} />
      <pointLight position={[2, 1.5, -2]} intensity={3.5} color={CYAN} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[3.2, 64]} />
        <meshStandardMaterial color="#0a1020" metalness={0.3} roughness={0.35} emissive="#0f1a2e" emissiveIntensity={0.12} />
      </mesh>

      <group ref={rig}>
        <ProjectCore />
        <FlowLinks />
        {WORKFLOW_NODES.map((node) => (
          <WorkflowNode key={node.label} angle={node.angle} color={node.color} radius={1.65} />
        ))}
      </group>

      <Float speed={1.1} floatIntensity={0.2} rotationIntensity={0.08}>
        <Sparkles count={36} scale={[5, 2.5, 5]} size={1.2} speed={0.22} color="#8af4ff" opacity={0.35} />
      </Float>
    </>
  );
}

export default function WorkflowFinaleScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [2.8, 2.1, 3.4], fov: 38, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene />
    </Canvas>
  );
}
