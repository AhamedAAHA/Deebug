import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Environment,
  GizmoHelper,
  GizmoViewport,
  PerspectiveCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { heatmapColor, estimateElementCost } from '../../utils/vizAnalytics';
import { PlanWireframeByType } from './PlanWireframe';
import SvgPlanFloor from './SvgPlanFloor';
import SiteVolumes from './SiteVolumes';
import '../../styles/visualization.css';

function safePositive(n, fallback = 1) {
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const TYPE_COLORS = {
  slab: '#8fb2ff',
  wall: '#c6ccd8',
  column: '#9c8cff',
  door: '#dba16a',
  window: '#83dcd3',
  roof: '#9aa5b5',
  cad: '#7f8bff',
};

function getDisplaySize(element, viewMode) {
  const [sx, sy, sz] = element.size;
  if (viewMode === 'plan') {
    return [sx, Math.max(0.035, sy * 0.4), Math.max(0.06, sz * 1.2)];
  }
  if (viewMode === 'massing' || viewMode === 'xray') {
    if (element.type === 'cad') {
      return [sx, Math.max(0.45, sy + 0.35), Math.max(0.14, sz * 2.5)];
    }
    if (element.type === 'wall') {
      return [sx, Math.max(0.55, sy * 1.8), sz];
    }
    if (element.type === 'column') {
      return [sx, Math.max(0.85, sy * 1.5), sz];
    }
    return [sx, Math.max(sy, 0.2), sz];
  }
  return element.size;
}

function AnimatedElement({
  element,
  assembleProgress,
  selected,
  onSelect,
  floorDelay,
  viewMode,
  maxHeatCost,
}) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const targetY = element.position[1];
  const isColumn = element.type === 'column';
  const isWall = element.type === 'wall' || element.type === 'cad';
  const displaySize = useMemo(() => {
    const size = getDisplaySize(element, viewMode);
    return size.map((v) => (Number.isFinite(v) && v > 0 ? v : 0.1));
  }, [element, viewMode]);

  const position = useMemo(() => {
    const p = element.position || [0, 0, 0];
    return p.map((v) => (Number.isFinite(v) ? v : 0));
  }, [element.position]);

  const localProgress = useMemo(() => {
    const p = Math.max(0, Math.min(1, (assembleProgress - floorDelay) / 0.35));
    return p;
  }, [assembleProgress, floorDelay]);

  useFrame(() => {
    if (!meshRef.current) return;
    const scaleY = isColumn || isWall
      ? THREE.MathUtils.lerp(0.01, 1, localProgress)
      : 1;
    meshRef.current.scale.y = scaleY;
    if (isColumn) {
      meshRef.current.position.y = THREE.MathUtils.lerp(0, targetY, localProgress);
    } else if (!isWall) {
      meshRef.current.position.y = THREE.MathUtils.lerp(-2, targetY, localProgress);
    } else {
      meshRef.current.position.y = element.position[1];
    }
  });

  let color = TYPE_COLORS[element.type] || '#0ea5e9';
  if (viewMode === 'heatmap') {
    color = heatmapColor(element, maxHeatCost);
  }

  const emissive = selected ? '#7c6df4' : hovered ? '#65d8d0' : '#ffffff';
  const emissiveIntensity = selected ? 0.85 : hovered ? 0.45 : 0;
  const opacity = viewMode === 'xray' ? (element.type === 'cad' ? 0.35 : 0.55) : Math.max(0.35, localProgress);
  const transparent = viewMode === 'xray' || localProgress < 1;

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={element.rotation}
      castShadow={viewMode !== 'plan'}
      receiveShadow
      onClick={(e) => { e.stopPropagation(); onSelect(element); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {element.shape === 'cylinder'
        ? <cylinderGeometry args={[displaySize[0] / 2, displaySize[0] / 2, displaySize[1], 16]} />
        : <boxGeometry args={displaySize} />}
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={viewMode === 'plan' ? 0.6 : 0.25}
        roughness={viewMode === 'plan' ? 0.35 : 0.55}
        transparent={transparent}
        opacity={opacity}
        depthWrite={!transparent}
      />
    </mesh>
  );
}

function SiteEnvelope({ groundSize, footprint }) {
  if (!footprint) return null;
  const w = Math.min(safePositive(footprint.width) * 1.1, safePositive(groundSize) * 0.9);
  const d = Math.min(safePositive(footprint.height) * 1.1, safePositive(groundSize) * 0.9);
  if (!Number.isFinite(w) || !Number.isFinite(d)) return null;
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial color="#7c6df4" transparent opacity={0.06} />
    </mesh>
  );
}

function BuildingModel({
  elements,
  wireframeLines,
  siteVolumes,
  planSvg,
  assembleProgress,
  selectedId,
  onSelect,
  groundSize,
  viewMode,
  maxHeatCost,
  footprint,
}) {
  const isSite3d = viewMode === 'site3d';
  const showPlanLines = viewMode === 'plan' && wireframeLines?.length > 0;
  const showSite3d = isSite3d && (siteVolumes?.length > 0 || wireframeLines?.length > 0);
  const showSvg = viewMode === 'plan' && planSvg;
  const showSvgUnderlay = isSite3d && planSvg;
  const showMeshes = !isSite3d && viewMode !== 'plan';
  const showEdgeLines = isSite3d && wireframeLines?.length > 0 && (siteVolumes?.length || 0) < 6;
  const progress = assembleProgress ?? 1;
  const delays = { slab: 0, column: 0.1, wall: 0.2, cad: 0.15, door: 0.45, window: 0.5, roof: 0.55 };

  return (
    <group>
      {showSvgUnderlay && (
        <group position={[0, 0.02, 0]}>
          <SvgPlanFloor svg={planSvg} size={groundSize * 0.98} opacity={0.35} />
        </group>
      )}
      {showSvg && <SvgPlanFloor svg={planSvg} size={groundSize * 0.95} />}
      {showSite3d && (
        <SiteVolumes
          volumes={siteVolumes || []}
          wallLines={wireframeLines || []}
          assembleProgress={progress}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}
      {showEdgeLines && (
        <group position={[0, 0.12, 0]}>
          <PlanWireframeByType lines={wireframeLines.slice(0, 1200)} />
        </group>
      )}
      {showPlanLines && <PlanWireframeByType lines={wireframeLines} />}
      {showMeshes && elements.map((el) => (
        <AnimatedElement
          key={el.id}
          element={el}
          assembleProgress={assembleProgress}
          selected={selectedId === el.id}
          onSelect={onSelect}
          floorDelay={delays[el.type] ?? 0.1}
          viewMode={viewMode}
          maxHeatCost={maxHeatCost}
        />
      ))}
      <SiteEnvelope groundSize={groundSize} footprint={footprint} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#f6f8fc" metalness={0.05} roughness={0.78} transparent opacity={0.82} />
      </mesh>
      <gridHelper
        args={[groundSize, 40, '#c6cde0', '#e5e9f3']}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}

function RotatingCamera({ radius, targetY, enabled }) {
  useFrame(({ camera, clock }) => {
    if (!enabled || !camera) return;
    const t = clock.getElapsedTime() * 0.06;
    camera.position.x = Math.sin(t) * radius;
    camera.position.z = Math.cos(t) * radius;
    camera.lookAt(0, targetY, 0);
  });
  return null;
}

function SceneContent({
  elements,
  wireframeLines,
  siteVolumes,
  planSvg,
  viewMode,
  analytics,
  selected,
  onSelect,
  autoRotate,
  assembleProgress,
  started,
}) {
  const scene = useMemo(() => {
    const coords = [];
    elements.forEach((e) => {
      const x = e.position?.[0];
      const z = e.position?.[2];
      const sx = e.size?.[0];
      const sz = e.size?.[2];
      if (Number.isFinite(x) && Number.isFinite(sx)) coords.push(Math.abs(x) + sx / 2);
      if (Number.isFinite(z) && Number.isFinite(sz)) coords.push(Math.abs(z) + sz / 2);
    });
    (siteVolumes || []).forEach((v) => {
      if (Number.isFinite(v.center?.[0])) coords.push(Math.abs(v.center[0]));
      if (Number.isFinite(v.center?.[2])) coords.push(Math.abs(v.center[2]));
    });
    const span = coords.length ? Math.max(...coords) : 10;
    const safeSpan = safePositive(span, 10);
    const siteHeights = (siteVolumes || [])
      .map((v) => v.height)
      .filter((h) => Number.isFinite(h) && h > 0);
    const elementHeights = elements
      .map((e) => e.position[1] + e.size[1] / 2)
      .filter((h) => Number.isFinite(h));
    const maxY = viewMode === 'site3d'
      ? (siteHeights.length ? Math.max(...siteHeights) : 4)
      : (elementHeights.length ? Math.max(...elementHeights) : 2);
    return {
      groundSize: Math.ceil(safeSpan * 2.6),
      radius: Math.max(22, safeSpan * 2.1),
      targetY: viewMode === 'plan' ? 1 : viewMode === 'site3d' ? maxY * 0.55 : maxY / 2 + 0.5,
    };
  }, [elements, siteVolumes, viewMode]);

  const maxHeatCost = useMemo(
    () => Math.max(...elements.map((e) => estimateElementCost(e)), 1),
    [elements],
  );

  const camPos = useMemo(() => {
    if (viewMode === 'plan') return [scene.radius, scene.radius * 0.95, scene.radius];
    if (viewMode === 'site3d') {
      const r = scene.radius * 0.85;
      return [r * 0.9, scene.targetY + r * 0.55, r * 0.9];
    }
    return [scene.radius, scene.targetY + scene.radius * 0.35, scene.radius];
  }, [scene, viewMode]);

  return (
    <>
      <PerspectiveCamera makeDefault position={camPos} fov={viewMode === 'site3d' ? 48 : 42} />
      <color attach="background" args={['#080d19']} />
      <fog attach="fog" args={['#080d19', scene.groundSize * 0.9, scene.groundSize * 2.4]} />
      <ambientLight intensity={viewMode === 'site3d' ? 0.9 : 0.78} />
      <hemisphereLight intensity={0.65} groundColor="#0d1424" color="#dbe7ff" />
      <directionalLight
        position={[scene.radius * 0.6, scene.radius * 1.2, scene.radius * 0.4]}
        intensity={viewMode === 'site3d' ? 1.8 : 1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-scene.radius, scene.radius * 0.5, -scene.radius]} intensity={0.55} color="#c9c3ff" />
      <pointLight position={[0, scene.targetY + 8, 0]} intensity={0.75} color="#7c6df4" distance={scene.groundSize * 1.5} />
      <Suspense fallback={null}>
        <Environment preset="city" />
        <BuildingModel
          elements={elements}
          wireframeLines={wireframeLines}
          siteVolumes={siteVolumes}
          planSvg={planSvg}
          assembleProgress={started ? assembleProgress : 1}
          selectedId={selected?.id}
          onSelect={onSelect}
          groundSize={scene.groundSize}
          viewMode={viewMode}
          maxHeatCost={maxHeatCost}
          footprint={analytics.footprint}
        />
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={scene.groundSize} blur={2.5} far={40} />
      </Suspense>
      <OrbitControls
        enablePan
        enableZoom
        target={[0, scene.targetY, 0]}
        minDistance={6}
        maxDistance={scene.radius * 2.5}
        maxPolarAngle={viewMode === 'plan' ? Math.PI / 2.05 : Math.PI / 2.15}
      />
      <RotatingCamera radius={scene.radius} targetY={scene.targetY} enabled={autoRotate} />
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport axisColors={['#ef7f7f', '#54b782', '#7c6df4']} labelColor="#263344" />
      </GizmoHelper>
    </>
  );
}

export default function BuildingScene({
  elements,
  allElements,
  wireframeLines,
  siteVolumes,
  planSvg,
  viewMode,
  drawing,
  analytics,
  selected,
  onSelect,
  isFullscreen = false,
  onToggleFullscreen,
  onOpenDock,
  viewModes,
  activeViewMode,
  onViewModeChange,
}) {
  const [assembleProgress, setAssembleProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [started, setStarted] = useState(false);
  const isCadPreview = (allElements || elements).some((e) => e.sourceLayer);
  const fileLabel = drawing?.fileName || 'Project model';

  const startAssembly = () => {
    setStarted(true);
    setAssembleProgress(0);
    const start = performance.now();
    const duration = 5000;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setAssembleProgress(p);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const resetView = () => {
    setStarted(false);
    setAssembleProgress(0);
    onSelect(null);
  };

  return (
    <div className={`viz-container viz-container-embedded ${isFullscreen ? 'viz-container--fullscreen' : ''}`}>
      <div className={`viz-canvas-wrap glass-card ${isFullscreen ? 'viz-canvas-wrap--fullscreen' : ''}`}>
        <div className="viz-canvas-topbar">
          <div className="viz-canvas-title">
            <span className="viz-live-dot" />
            <span>Live BIM Viewer</span>
            <span className="viz-canvas-file">{fileLabel}</span>
          </div>
          <div className="viz-canvas-mode-badge">
            {viewMode === 'site3d' && 'Site 3D Model'}
            {viewMode === 'massing' && '3D Massing'}
            {viewMode === 'plan' && 'Plan Overlay'}
            {viewMode === 'heatmap' && 'Cost Heatmap'}
            {viewMode === 'xray' && 'X-Ray Scan'}
          </div>
        </div>

        <Canvas shadows gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
          <SceneContent
            elements={elements}
            wireframeLines={wireframeLines}
            siteVolumes={siteVolumes}
            planSvg={planSvg}
            viewMode={viewMode}
            analytics={analytics}
            selected={selected}
            onSelect={onSelect}
            autoRotate={autoRotate}
            assembleProgress={assembleProgress}
            started={started}
          />
        </Canvas>

        <div className="viz-controls">
          <button type="button" className="btn btn-primary btn-sm" onClick={startAssembly}>
            ▶ Build Sequence
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAutoRotate(!autoRotate)}>
            {autoRotate ? '⏸ Orbit' : '↻ Orbit'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={resetView}>
            ⟲ Reset
          </button>
          {onToggleFullscreen && (
            <button type="button" className="btn btn-ghost btn-sm viz-fs-btn" onClick={onToggleFullscreen}>
              {isFullscreen ? '⊡ Exit full screen' : '⛶ Full screen'}
            </button>
          )}
          {onOpenDock && !isFullscreen && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpenDock('view')}>
              ☰ Panels
            </button>
          )}
        </div>

        {isFullscreen && viewModes && onViewModeChange && (
          <div className="viz-fs-modes">
            {viewModes.map((m) => (
              <button
                key={m.id}
                type="button"
                className={activeViewMode === m.id ? 'active' : ''}
                onClick={() => onViewModeChange(m.id)}
                title={m.label}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        )}

        <div className="viz-compass" aria-hidden>
          <span>N</span>
          <div className="viz-compass-ring" />
        </div>

        <div className="viz-scale-bar">
          <div className="viz-scale-line" />
          <span>Scale: drawing units</span>
        </div>

        {viewMode === 'heatmap' && (
          <div className="viz-heatmap-legend">
            <span>Low cost</span>
            <div className="viz-heatmap-gradient" />
            <span>High cost</span>
          </div>
        )}
      </div>

      {!isFullscreen && (
        <p className="viz-hint">
          {isCadPreview
            ? 'Site 3D — extruded villa & boundaries. Use Build Sequence. Switch modes in panels below.'
            : 'Scroll zoom · drag orbit · Full screen for immersive view.'}
        </p>
      )}
    </div>
  );
}
