import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, Grid, Line, RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

type StageProps = {
  progress: number;
  pointer: { x: number; y: number };
};

const lerp = (a: number, b: number, amount: number) => a + (b - a) * amount;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value: number, start: number, end: number) => clamp((value - start) / (end - start));

const CYAN = '#35e7ff';
const BLUE = '#4b8cff';
const INDIGO = '#8a7dff';

function GlassPanel({ color = '#1a2332', opacity = 0.92 }: { color?: string; opacity?: number }) {
  return (
    <meshPhysicalMaterial
      color={color}
      transparent
      opacity={opacity}
      roughness={0.12}
      metalness={0.22}
      emissive="#1a4a5c"
      emissiveIntensity={0.28}
      clearcoat={1}
      clearcoatRoughness={0.06}
      reflectivity={0.85}
    />
  );
}

function GlowBar({ position, width, color }: { position: THREE.Vector3Tuple; width: number; color: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.032, 0.05]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
    </mesh>
  );
}

function BoqCard({
  position,
  size,
  accent,
  children,
}: {
  position: THREE.Vector3Tuple;
  size: THREE.Vector3Tuple;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <group position={position}>
      <RoundedBox args={size} radius={0.12} smoothness={9} castShadow receiveShadow>
        <GlassPanel color="#15202b" opacity={0.9} />
      </RoundedBox>
      <GlowBar position={[0, size[1] / 2 + 0.02, size[2] / 2 - 0.14]} width={size[0] * 0.68} color={accent} />
      {children}
    </group>
  );
}

function SpatialGridFloor({ progress }: { progress: number }) {
  const strength = 0.28 + range(progress, 0, 0.45) * 0.42;
  return (
    <group position={[0, -0.04, 0]}>
      <Grid
        args={[14, 14]}
        cellSize={0.38}
        cellThickness={0.75}
        cellColor={CYAN}
        sectionSize={1.9}
        sectionThickness={1.35}
        sectionColor={INDIGO}
        fadeDistance={16}
        fadeStrength={1.2}
        infiniteGrid
        position={[0, 0, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial
          color="#0a1020"
          transparent
          opacity={0.55 * strength}
          metalness={0.35}
          roughness={0.25}
          emissive="#0f1a2e"
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

function DepthLayers({ progress }: { progress: number }) {
  const layers = useMemo(
    () => [
      { y: 0.52, color: CYAN, label: 0.12 },
      { y: 0.88, color: BLUE, label: 0.38 },
      { y: 1.24, color: INDIGO, label: 0.62 },
    ],
    [],
  );

  return (
    <group>
      {layers.map((layer, index) => {
        const lift = range(progress, layer.label, layer.label + 0.22) * 0.35;
        const opacity = 0.08 + range(progress, layer.label - 0.05, layer.label + 0.2) * 0.22;
        return (
          <mesh key={index} position={[0, layer.y + lift, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[6.2 - index * 0.4, 4.2 - index * 0.35]} />
            <meshBasicMaterial color={layer.color} transparent opacity={opacity} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

function OrbitRings({ progress }: { progress: number }) {
  const scale = 0.7 + range(progress, 0.2, 0.75) * 0.55;
  const opacity = 0.25 + range(progress, 0.25, 0.8) * 0.45;

  return (
    <group position={[0, 1.05, 0]} scale={scale}>
      {[1.35, 1.75, 2.15].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, index * 0.4]}>
          <torusGeometry args={[radius, 0.014, 8, 96]} />
          <meshStandardMaterial
            color={index === 1 ? INDIGO : CYAN}
            emissive={index === 1 ? INDIGO : CYAN}
            emissiveIntensity={0.9}
            transparent
            opacity={opacity * (1 - index * 0.15)}
          />
        </mesh>
      ))}
    </group>
  );
}

function QuantityBars({ progress }: { progress: number }) {
  const bars = useMemo(
    () =>
      [
        [2.35, 0.22, 0.55, 0.42],
        [2.55, 0.35, 0.55, 0.58],
        [2.75, 0.48, 0.55, 0.74],
        [2.95, 0.3, 0.55, 0.5],
        [3.15, 0.62, 0.55, 0.88],
        [3.35, 0.4, 0.55, 0.65],
      ] as const,
    [],
  );
  const visible = range(progress, 0.08, 0.42);

  return (
    <group position={[0.15, 0, 0.35]}>
      {bars.map(([x, h, w, d], index) => (
        <mesh key={index} position={[x - 2.7, h / 2 + 0.14, d - 0.7]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshPhysicalMaterial
            color="#1e3a5f"
            emissive={index % 2 === 0 ? CYAN : BLUE}
            emissiveIntensity={0.35 + visible * 0.4}
            metalness={0.25}
            roughness={0.15}
            clearcoat={1}
          />
        </mesh>
      ))}
      <mesh position={[2.55, 0.14, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.72, 48]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.35 * visible} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SatelliteNodes({ progress }: { progress: number }) {
  const nodes = useMemo(
    () => [
      [-2.4, 1.35, -0.6, CYAN],
      [2.5, 1.55, 0.4, BLUE],
      [-1.2, 1.75, 1.35, INDIGO],
      [1.8, 1.25, -1.2, CYAN],
      [0.5, 2.05, 1.5, BLUE],
    ] as const,
    [],
  );
  const show = range(progress, 0.3, 0.65);

  return (
    <group>
      {nodes.map(([x, y, z, color], index) => (
        <Float key={index} speed={1.4 + index * 0.15} floatIntensity={0.22} rotationIntensity={0.08}>
          <group position={[x, y + show * 0.15, z]} scale={0.5 + show * 0.5}>
            <mesh castShadow>
              <octahedronGeometry args={[0.11, 0]} />
              <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={1.1} metalness={0.4} roughness={0.1} clearcoat={1} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.2, 0.006, 8, 40]} />
              <meshBasicMaterial color={color} transparent opacity={0.65 * show} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

function MiniBuilding({ progress }: { progress: number }) {
  const explode = range(progress, 0.25, 0.56);
  const settle = range(progress, 0.8, 0.98);
  const spread = explode * (1 - settle);

  return (
    <group>
      <RoundedBox args={[5.7, 0.28, 3.45]} radius={0.2} smoothness={10} castShadow receiveShadow>
        <meshPhysicalMaterial color="#1e293b" emissive="#0f172a" emissiveIntensity={0.35} roughness={0.18} metalness={0.18} clearcoat={1} />
      </RoundedBox>

      <group position={[0, 0.36 + spread * 0.22, 0]}>
        {[
          [[-1.55 - spread * 0.45, 0.15, -0.94], [1.35, 0.24, 0.08]],
          [[0.05, 0.15, -0.94 - spread * 0.2], [1.18, 0.24, 0.08]],
          [[1.45 + spread * 0.4, 0.15, -0.12], [0.08, 0.24, 1.22]],
          [[-1.2 - spread * 0.3, 0.15, 0.86 + spread * 0.26], [1.84, 0.24, 0.08]],
          [[-0.35, 0.15, 0.12], [0.08, 0.24, 1.5]],
        ].map(([position, size], index) => (
          <RoundedBox key={index} args={size as THREE.Vector3Tuple} radius={0.035} smoothness={4} position={position as THREE.Vector3Tuple} castShadow>
            <meshPhysicalMaterial color="#334155" emissive={CYAN} emissiveIntensity={0.18} roughness={0.14} metalness={0.2} clearcoat={1} />
          </RoundedBox>
        ))}

        {[
          [-1.95, 0.48, -1.1],
          [1.95, 0.48, -1.1],
          [-1.95, 0.48, 1.1],
          [1.95, 0.48, 1.1],
          [0.1, 0.48, 1.1],
        ].map((position, index) => (
          <mesh key={`col-${index}`} position={position as THREE.Vector3Tuple} castShadow>
            <boxGeometry args={[0.15, 0.75 + spread * 0.35, 0.15]} />
            <meshPhysicalMaterial color="#475569" emissive={BLUE} emissiveIntensity={0.22} roughness={0.12} metalness={0.25} clearcoat={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function DrawingSheet({ position, progress }: { position: THREE.Vector3Tuple; progress: number }) {
  const lift = range(progress, 0.12, 0.38);
  return (
    <group position={[position[0] - lift * 0.55, position[1] + lift * 0.55, position[2] - lift * 0.35]} rotation={[0, 0, -0.02]}>
      <RoundedBox args={[2.35, 0.08, 1.42]} radius={0.1} smoothness={8} castShadow receiveShadow>
        <GlassPanel color="#0f172a" opacity={0.88} />
      </RoundedBox>
      <Line points={[[-0.9, 0.08, -0.42], [0.75, 0.08, -0.42], [0.75, 0.08, 0.36], [-0.9, 0.08, 0.36], [-0.9, 0.08, -0.42]]} color={CYAN} lineWidth={1.5} transparent opacity={0.9} />
      <Line points={[[-0.9, 0.09, -0.05], [0.75, 0.09, -0.05], [0.15, 0.09, 0.36], [0.15, 0.09, -0.42]]} color={INDIGO} lineWidth={1.2} transparent opacity={0.65} />
      <Line points={[[-0.45, 0.1, -0.1], [0.2, 0.1, 0.15], [0.45, 0.1, -0.2]]} color={BLUE} lineWidth={1} transparent opacity={0.45} />
    </group>
  );
}

function CostMarkers({ progress }: { progress: number }) {
  const show = range(progress, 0.45, 0.78);
  const markers = useMemo(
    () => [
      [-0.8, 0.95, 0.4],
      [0.4, 1.05, -0.5],
      [1.2, 0.88, 0.65],
    ] as const,
    [],
  );

  return (
    <group>
      {markers.map(([x, y, z], index) => (
        <mesh key={index} position={[x, y + show * 0.2, z]} scale={show}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={index === 1 ? '#4ade80' : CYAN} emissive={index === 1 ? '#22c55e' : CYAN} emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}

function SurveyWorkspace({ progress }: { progress: number }) {
  const explode = range(progress, 0.28, 0.6);
  const settle = range(progress, 0.82, 0.98);
  const spread = explode * (1 - settle);

  return (
    <group>
      <MiniBuilding progress={progress} />
      <DrawingSheet position={[-1.92, 0.62, -1.05]} progress={progress} />
      <QuantityBars progress={progress} />
      <CostMarkers progress={progress} />

      <BoqCard position={[2.0 + spread * 1.1, 0.72 + spread * 0.7, -1.0 - spread * 0.45]} size={[2.15, 0.24, 1.02]} accent={CYAN}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[-0.82 + i * 0.41, 0.22 + i * 0.05, 0.05]}>
            <boxGeometry args={[0.18, 0.12 + i * 0.07, 0.06]} />
            <meshStandardMaterial color="#8af4ff" emissive={CYAN} emissiveIntensity={0.75} />
          </mesh>
        ))}
      </BoqCard>

      <BoqCard position={[-1.85 - spread * 1.0, 0.8 + spread * 0.85, 0.92 + spread * 0.46]} size={[2.22, 0.24, 0.94]} accent={INDIGO}>
        <GlowBar position={[-0.18, 0.18, 0.14]} width={1.32} color="#c4b5fd" />
        <GlowBar position={[-0.42, 0.18, -0.02]} width={0.82} color="#e8e4ff" />
        <GlowBar position={[0.35, 0.18, 0.08]} width={0.65} color={CYAN} />
      </BoqCard>

      <BoqCard position={[1.75 + spread * 0.92, 0.62 + spread * 0.45, 0.95 + spread * 0.76]} size={[2.22, 0.22, 0.84]} accent={BLUE}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-0.62 + i * 0.42, 0.17, 0.05]}>
            <cylinderGeometry args={[0.11 + i * 0.012, 0.11 + i * 0.012, 0.05, 28]} />
            <meshStandardMaterial color={['#f3d9ad', '#f0a996', '#c8f7ff', '#ece8ff'][i]} emissive={BLUE} emissiveIntensity={0.15} />
          </mesh>
        ))}
      </BoqCard>

      <BoqCard position={[0.2 + spread * 0.35, 1.02 + spread * 0.5, -1.65 - spread * 0.3]} size={[1.45, 0.18, 0.72]} accent={CYAN}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-0.35 + i * 0.35, 0.14, 0.04]}>
            <boxGeometry args={[0.14, 0.08 + i * 0.05, 0.05]} />
            <meshStandardMaterial color="#67e8f9" emissive={CYAN} emissiveIntensity={0.5} />
          </mesh>
        ))}
      </BoqCard>
    </group>
  );
}

function AiModule({ position, color, delay, scale = 1 }: { position: THREE.Vector3Tuple; color: string; delay: number; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.1 + delay) * 0.1;
    ref.current.rotation.y += 0.012;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.26, 1]} />
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={1.05} roughness={0.1} metalness={0.35} clearcoat={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.014, 12, 72]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} transparent opacity={0.82} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0.3, 0]}>
        <torusGeometry args={[0.52, 0.008, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function DataLinks({ progress }: { progress: number }) {
  const visible = 0.22 + range(progress, 0.3, 0.78) * 0.55;
  const links = useMemo(
    () => [
      [[-2.2, 1.1, -1.1], [0, 2.05, 0], [2.18, 1.1, -1.08]] as THREE.Vector3Tuple[],
      [[-2.05, 1.02, 1.08], [0, 2.05, 0], [2.05, 1.02, 1.12]] as THREE.Vector3Tuple[],
      [[0, 0.95, 0], [0, 2.05, 0]] as THREE.Vector3Tuple[],
      [[-1.4, 0.7, -0.5], [0, 1.4, 0], [1.5, 0.75, 0.6]] as THREE.Vector3Tuple[],
      [[2.2, 0.55, 0.2], [0, 1.8, 0], [-1.8, 0.9, -0.8]] as THREE.Vector3Tuple[],
      [[0, 0.5, -1.2], [0, 1.2, 0], [0, 2.1, 0]] as THREE.Vector3Tuple[],
    ],
    [],
  );

  return (
    <group>
      {links.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={index % 3 === 0 ? CYAN : index % 3 === 1 ? INDIGO : BLUE}
          lineWidth={index < 3 ? 1.8 : 1.2}
          transparent
          opacity={visible * (index < 3 ? 0.65 : 0.4)}
        />
      ))}
      <Sparkles count={90} scale={[9, 5, 6]} size={1.6} speed={0.32} color="#c8f7ff" opacity={0.42 * visible} />
      <Sparkles count={40} scale={[6, 3.5, 5]} size={0.9} speed={0.45} color={INDIGO} opacity={0.28 * visible} />
    </group>
  );
}

function Scene({ progress, pointer }: StageProps) {
  const rig = useRef<THREE.Group>(null);
  const moduleScale = range(progress, 0.34, 0.58) * 0.55;
  const showAi = progress >= 0.28;
  const showExtras = progress >= 0.18;

  useFrame((state) => {
    if (!rig.current) return;
    const finalOrbit = range(progress, 0.76, 1);
    rig.current.rotation.x = lerp(rig.current.rotation.x, -0.18 + pointer.y * 0.035, 0.055);
    rig.current.rotation.y = lerp(rig.current.rotation.y, -0.28 + pointer.x * 0.08 + finalOrbit * 0.62, 0.05);
    state.camera.position.x = lerp(state.camera.position.x, pointer.x * 0.22 + finalOrbit * 0.65, 0.045);
    state.camera.position.y = lerp(state.camera.position.y, 2.05 + pointer.y * 0.1, 0.045);
    state.camera.position.z = lerp(state.camera.position.z, 5.75 - range(progress, 0, 0.32) * 0.45, 0.045);
    state.camera.lookAt(0, 0.38, 0);
  });

  return (
    <>
      <color attach="background" args={['#090d1a']} />
      <fog attach="fog" args={['#090d1a', 12, 28]} />
      <ambientLight intensity={0.52} />
      <hemisphereLight intensity={0.62} color="#c8f7ff" groundColor="#0f172a" />
      <directionalLight castShadow position={[5.2, 8, 6]} intensity={3.1} color="#f0f9ff" shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-4, 4, -3]} intensity={1.35} color={INDIGO} />
      <pointLight position={[-4, 3.5, 2]} intensity={5} color={INDIGO} distance={18} />
      <pointLight position={[4.5, 2.2, -2]} intensity={4.8} color={CYAN} distance={16} />

      <group ref={rig} position={[0, -0.1, 0]}>
        <SpatialGridFloor progress={progress} />
        {showExtras && <DepthLayers progress={progress} />}
        <SurveyWorkspace progress={progress} />
        {showExtras && <OrbitRings progress={progress} />}
        {showAi && (
          <group scale={0.35 + moduleScale}>
            <AiModule position={[0, 2.35, 0]} color={INDIGO} delay={0} scale={1.15} />
            <AiModule position={[-2.85, 1.55, -1.4]} color={CYAN} delay={1} />
            <AiModule position={[2.95, 1.48, 1.4]} color={BLUE} delay={2} />
            {progress >= 0.55 && (
              <AiModule position={[0.2, 1.65, -2.1]} color={CYAN} delay={1.5} scale={0.75} />
            )}
          </group>
        )}
        {showExtras && <SatelliteNodes progress={progress} />}
        {showExtras && <DataLinks progress={progress} />}
      </group>

      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={14} blur={2.2} far={5.5} color="#020617" />
      {showExtras && (
        <Float speed={0.85} rotationIntensity={0.1} floatIntensity={0.25}>
          <Sparkles count={28} scale={[9, 4.5, 6]} size={1.2} speed={0.18} color="#8af4ff" opacity={0.28} />
        </Float>
      )}
    </>
  );
}

export default function CinematicStage(props: StageProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2.05, 5.75], fov: 36, near: 0.1, far: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.22,
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
