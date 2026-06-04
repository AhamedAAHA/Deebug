import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/** Syncs compass UI to camera orbit heading */
export function CompassSync({ enabled = true }) {
  useFrame(({ camera }) => {
    if (!enabled || typeof document === 'undefined') return;
    const heading = Math.atan2(camera.position.x, camera.position.z);
    document.documentElement.style.setProperty('--viz-heading', `${heading}rad`);
  });
  return null;
}

/** Vertical holographic scan ring (DaiBoq digital twin signature) */
export function ScanBeam({ extent = 24, enabled = true }) {
  const ringRef = useRef();
  const beamRef = useRef();

  useFrame(({ clock }) => {
    if (!enabled) return;
    const t = clock.getElapsedTime();
    const h = extent * 0.55;
    const y = (Math.sin(t * 0.42) * 0.5 + 0.5) * h + 0.15;
    if (ringRef.current) {
      ringRef.current.position.y = y;
      ringRef.current.rotation.z = t * 0.25;
    }
    if (beamRef.current) {
      beamRef.current.position.y = y;
      beamRef.current.material.opacity = 0.06 + Math.sin(t * 3) * 0.03;
    }
  });

  if (!enabled) return null;
  const r = extent * 0.38;

  return (
    <group>
      <mesh ref={beamRef} position={[0, extent * 0.25, 0]}>
        <planeGeometry args={[r * 2.2, extent * 0.85]} />
        <meshBasicMaterial
          color="#35e7ff"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.72, r, 72]} />
        <meshBasicMaterial
          color="#8a7dff"
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** Ground perimeter pulse — site boundary glow */
export function PerimeterPulse({ radius = 20, enabled = true }) {
  const ref = useRef();
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: '#35e7ff',
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!enabled || !ref.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.4) * 0.04;
    ref.current.scale.set(pulse, pulse, pulse);
    ref.current.rotation.z = clock.getElapsedTime() * 0.08;
    mat.opacity = 0.1 + (Math.sin(clock.getElapsedTime() * 2) + 1) * 0.06;
  });

  if (!enabled) return null;

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={mat}>
      <ringGeometry args={[radius * 0.82, radius * 0.92, 96]} />
    </mesh>
  );
}

/** Corner beacons for QS site framing */
export function SiteBeacons({ radius = 18, height = 6, enabled = true }) {
  const group = useRef();
  const positions = useMemo(() => {
    const r = radius * 0.75;
    return [
      [r, 0, r],
      [-r, 0, r],
      [r, 0, -r],
      [-r, 0, -r],
    ];
  }, [radius]);

  useFrame(({ clock }) => {
    if (!enabled || !group.current) return;
    group.current.children.forEach((child, i) => {
      const t = clock.getElapsedTime() + i * 1.2;
      child.position.y = 0.4 + Math.sin(t * 1.8) * 0.35;
      if (child.material) child.material.opacity = 0.35 + (Math.sin(t * 2.5) + 1) * 0.2;
    });
  });

  if (!enabled) return null;

  return (
    <group ref={group}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? '#35e7ff' : '#8a7dff'}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      <SiteFrameBox radius={radius} height={height} />
    </group>
  );
}

function SiteFrameBox({ radius, height }) {
  const edges = useMemo(() => {
    const box = new THREE.BoxGeometry(radius * 1.5, height, radius * 1.5);
    return new THREE.EdgesGeometry(box);
  }, [radius, height]);

  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color="#35e7ff" transparent opacity={0.14} />
    </lineSegments>
  );
}

/** Soft starfield behind the model */
export function ShowcaseStars({ enabled = true }) {
  if (!enabled) return null;
  return (
    <Stars
      radius={80}
      depth={40}
      count={1200}
      factor={2.2}
      saturation={0.35}
      fade
      speed={0.35}
    />
  );
}

/** Orbiting accent lights */
export function OrbitingLights({ radius = 22, height = 8, enabled = true }) {
  const cyan = useRef();
  const violet = useRef();

  useFrame(({ clock }) => {
    if (!enabled) return;
    const t = clock.getElapsedTime();
    if (cyan.current) {
      cyan.current.position.set(
        Math.sin(t * 0.35) * radius,
        height + Math.sin(t * 0.7) * 2,
        Math.cos(t * 0.35) * radius,
      );
    }
    if (violet.current) {
      violet.current.position.set(
        Math.cos(t * 0.28 + 1) * radius * 0.85,
        height * 0.6,
        Math.sin(t * 0.28 + 1) * radius * 0.85,
      );
    }
  });

  if (!enabled) return null;

  return (
    <>
      <pointLight ref={cyan} color="#35e7ff" intensity={1.1} distance={radius * 3} />
      <pointLight ref={violet} color="#8a7dff" intensity={0.85} distance={radius * 2.5} />
    </>
  );
}

export default function ShowcaseEffects({
  extent = 24,
  enabled = true,
  stars = true,
  position = [0, 0, 0],
}) {
  const r = Math.max(12, extent);
  const pos = position.map((v) => (Number.isFinite(v) ? v : 0));

  return (
    <>
      {stars && <ShowcaseStars enabled={enabled} />}
      <CompassSync enabled={enabled} />
      <group position={pos}>
        <OrbitingLights radius={r} height={r * 0.35} enabled={enabled} />
        <PerimeterPulse radius={r * 0.95} enabled={enabled} />
        <ScanBeam extent={r} enabled={enabled} />
        <SiteBeacons radius={r} height={r * 0.3} enabled={enabled} />
      </group>
    </>
  );
}
