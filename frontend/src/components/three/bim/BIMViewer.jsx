import { useRef, useMemo, useState, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Environment,
  GizmoHelper,
  GizmoViewport,
  PerspectiveCamera,
  PointerLockControls,
  Grid,
} from '@react-three/drei';
import * as THREE from 'three';
import BIMModel from './BIMModel';
import { getBimBounds, explodeOffset } from '../../../utils/bimReconstruction';
import { CONSTRUCTION_STAGES } from '../../../utils/bimClassification';
import ShowcaseEffects from '../ShowcaseEffects';

const IS_PROD = import.meta.env.PROD;

function ClippingManager({ enabled, planeY, children }) {
  const { gl } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);

  useFrame(() => {
    gl.localClippingEnabled = enabled;
    plane.constant = planeY;
  });

  return (
    <group userData={{ clipPlane: plane }}>
      {children}
    </group>
  );
}

function CameraRig({ mode, span }) {
  const { camera } = useThree();

  useEffect(() => {
    const r = span * 1.2;
    switch (mode) {
      case 'floorplan':
        camera.position.set(0, r * 1.8, 0.01);
        break;
      case 'isometric':
        camera.position.set(r * 0.85, r * 0.75, r * 0.85);
        break;
      case 'drone':
        camera.position.set(0, r * 2.2, r * 0.3);
        break;
      case 'walkthrough':
        camera.position.set(0, 1.7, r * 0.4);
        break;
      default:
        camera.position.set(r, r * 0.65, r);
    }
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [mode, span, camera]);

  return null;
}

function SceneInner({
  bimModel,
  selectedId,
  onSelect,
  displayMode,
  bimDiscipline,
  constructionProgress,
  showLabels,
  hiddenFloors,
  isolatedFloor,
  exploded,
  sectionEnabled,
  sectionY,
  cameraMode,
  showPlanOverlay,
  autoRotate,
  showcaseMode,
  userInteracting,
  onControlsStart,
  onControlsEnd,
}) {
  const { span, centerX, centerY, centerZ } = useMemo(() => getBimBounds(bimModel), [bimModel]);
  const groundSize = Math.ceil(span * 2.2);
  const modelOffset = useMemo(
    () => [-centerX, -centerY, -centerZ],
    [centerX, centerY, centerZ],
  );

  const floorOffsets = useMemo(() => {
    if (!exploded) return {};
    const map = {};
    bimModel.floors.forEach((f) => {
      map[f.id] = explodeOffset(f.id, bimModel.floors, 6);
    });
    return map;
  }, [exploded, bimModel.floors]);

  const elements = useMemo(() => {
    return bimModel.elements.filter((el) => {
      if (hiddenFloors.has(el.floorId)) return false;
      if (isolatedFloor && el.floorId !== isolatedFloor) return false;
      return true;
    });
  }, [bimModel.elements, hiddenFloors, isolatedFloor]);

  return (
    <>
      <PerspectiveCamera makeDefault fov={cameraMode === 'drone' ? 52 : 42} near={0.1} far={Math.max(400, span * 10)} />
      <CameraRig mode={cameraMode} span={span} />
      <color attach="background" args={['#080d19']} />
      <fog attach="fog" args={['#080d19', span * 2.5, span * 8]} />
      <ambientLight intensity={0.78} />
      <hemisphereLight intensity={0.62} groundColor="#0d1424" color="#dbe7ff" />
      <directionalLight
        position={[span, span * 1.5, span * 0.5]}
        intensity={1.6}
        castShadow={!IS_PROD}
        shadow-mapSize={IS_PROD ? [1024, 1024] : [2048, 2048]}
        shadow-camera-far={80}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
      />
      <directionalLight position={[-span, span, -span]} intensity={0.48} color="#c9c3ff" />

      <ClippingManager enabled={sectionEnabled} planeY={sectionY}>
        <group position={modelOffset}>
          <BIMModel
            elements={elements}
            planOutline={bimModel.planOutline}
            selectedId={selectedId}
            onSelect={onSelect}
            displayMode={displayMode}
            bimDiscipline={bimDiscipline}
            constructionProgress={constructionProgress}
            showLabels={showLabels}
            floorOffsets={floorOffsets}
            showPlanOverlay={showPlanOverlay}
          />
        </group>
      </ClippingManager>
      <Suspense fallback={null}>
        {!IS_PROD && <Environment preset="warehouse" />}
      </Suspense>
      <ContactShadows opacity={0.45} scale={groundSize} blur={2.8} far={span * 2} position={[0, -0.02, 0]} />

      <ShowcaseEffects extent={span * 1.1} enabled={showcaseMode} stars position={modelOffset} />

      <Grid
        args={[groundSize, groundSize / 2]}
        position={[0, -0.02, 0]}
        cellColor="#c6cde0"
        sectionColor="#e5e9f3"
        fadeDistance={groundSize}
        infiniteGrid
      />

      {cameraMode === 'orbit' && (
        <OrbitControls
          target={[0, 0, 0]}
          enablePan
          autoRotate={autoRotate && !userInteracting}
          autoRotateSpeed={showcaseMode ? 0.9 : 0.5}
          onStart={onControlsStart}
          onEnd={onControlsEnd}
          maxPolarAngle={cameraMode === 'floorplan' ? 0.01 : Math.PI / 2.1}
          minDistance={4}
          maxDistance={span * 3}
        />
      )}
      {cameraMode === 'fps' && <PointerLockControls />}
      {cameraMode !== 'orbit' && cameraMode !== 'fps' && (
        <OrbitControls
          target={[0, 0, 0]}
          enablePan
          autoRotate={autoRotate && !userInteracting && cameraMode === 'isometric'}
          autoRotateSpeed={0.55}
          onStart={onControlsStart}
          onEnd={onControlsEnd}
          maxPolarAngle={cameraMode === 'floorplan' ? 0.05 : Math.PI / 2.05}
          minDistance={3}
          maxDistance={span * 3}
        />
      )}

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#ef7f7f', '#54b782', '#7c6df4']} labelColor="#263344" />
      </GizmoHelper>
    </>
  );
}

export default function BIMViewer({
  bimModel,
  selected,
  onSelect,
  toolbarState,
  onToolbarChange,
  isFullscreen,
}) {
  const {
    displayMode = 'architectural',
    bimDiscipline = 'architectural',
    constructionProgress = 1,
    showLabels = false,
    hiddenFloors = new Set(),
    isolatedFloor = null,
    exploded = false,
    sectionEnabled = false,
    sectionY = 5,
    cameraMode = 'orbit',
    showPlanOverlay = true,
    autoRotate = true,
    showcaseMode = true,
  } = toolbarState || {};

  const [userInteracting, setUserInteracting] = useState(false);
  const resumeRotateRef = useRef(null);

  const onControlsStart = useCallback(() => {
    setUserInteracting(true);
    if (resumeRotateRef.current) clearTimeout(resumeRotateRef.current);
  }, []);

  const onControlsEnd = useCallback(() => {
    if (resumeRotateRef.current) clearTimeout(resumeRotateRef.current);
    resumeRotateRef.current = setTimeout(() => setUserInteracting(false), 3500);
  }, []);

  useEffect(() => () => {
    if (resumeRotateRef.current) clearTimeout(resumeRotateRef.current);
  }, []);

  const selectedEl = useMemo(() => {
    if (!selected) return null;
    return bimModel.elements.find((e) => e.id === selected.id) || selected;
  }, [selected, bimModel.elements]);

  return (
    <div className={`bim-viewer ${isFullscreen ? 'bim-viewer--fs' : ''}`}>
      <Canvas
        shadows={!IS_PROD}
        dpr={IS_PROD ? [1, 1.25] : [1, 2]}
        gl={{
          antialias: !IS_PROD,
          localClippingEnabled: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
          });
          gl.domElement.addEventListener('webglcontextrestored', () => gl.resetState());
        }}
      >
        <SceneInner
          bimModel={bimModel}
          selectedId={selectedEl?.id}
          onSelect={(el) => onSelect?.(el)}
          displayMode={displayMode}
          bimDiscipline={bimDiscipline}
          constructionProgress={constructionProgress}
          showLabels={showLabels}
          hiddenFloors={hiddenFloors}
          isolatedFloor={isolatedFloor}
          exploded={exploded}
          sectionEnabled={sectionEnabled}
          sectionY={sectionY}
          cameraMode={cameraMode}
          showPlanOverlay={showPlanOverlay}
          autoRotate={autoRotate}
          showcaseMode={showcaseMode}
          userInteracting={userInteracting}
          onControlsStart={onControlsStart}
          onControlsEnd={onControlsEnd}
        />
      </Canvas>

      {showcaseMode && (
        <div className="viz-showcase-badge" aria-hidden>
          <span className="viz-showcase-badge__pulse" />
          Digital Twin Showcase
        </div>
      )}

      {sectionEnabled && (
        <div className="bim-section-slider">
          <label>Section cut height</label>
          <input
            type="range"
            min={-2}
            max={20}
            step={0.1}
            value={sectionY}
            onChange={(e) => onToolbarChange?.({ sectionY: parseFloat(e.target.value) })}
          />
        </div>
      )}

      {constructionProgress < 1 && (
        <div className={`bim-construction-badge ${constructionProgress < 0.15 ? 'bim-construction-badge--warn' : ''}`}>
          <span>
            {CONSTRUCTION_STAGES.find((s) => s.progress <= constructionProgress)?.label || 'Building…'}
            {' '}
            {Math.round(constructionProgress * 100)}%
          </span>
          {constructionProgress < 0.15 && (
            <button
              type="button"
              className="bim-construction-badge__action"
              onClick={() => onToolbarChange?.({ constructionProgress: 1 })}
            >
              Show full model
            </button>
          )}
        </div>
      )}
    </div>
  );
}
