import { useMemo, useRef } from 'react';
import { Edges, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getBimMaterial, heatmapMaterial } from './bimMaterials';
import { costHeatColor, progressHeatColor } from '../../../utils/bimQuantities';
import { categoryVisibleAtProgress } from '../../../utils/bimClassification';

function WallSegment({ el, selected, onSelect, displayMode, maxCost, showLabels }) {
  const dx = el.end[0] - el.start[0];
  const dz = el.end[2] - el.start[2];
  const len = Math.max(Math.hypot(dx, dz), 0.02);
  const mid = [(el.start[0] + el.end[0]) / 2, (el.start[1] + el.end[1]) / 2, (el.start[2] + el.end[2]) / 2];
  const rotY = -Math.atan2(dz, dx);
  const thickness = Math.max(el.thickness, 0.08);
  const height = Math.max(el.height, 0.08);

  let material = getBimMaterial(el.material, {
    wireframe: displayMode === 'wireframe',
    transparent: displayMode === 'xray',
    opacity: displayMode === 'xray' ? 0.35 : 1,
  });
  if (displayMode === 'costHeat') {
    material = heatmapMaterial(costHeatColor(el.qs?.cost || 0, maxCost), {
      wireframe: false,
      opacity: displayMode === 'xray' ? 0.5 : 0.92,
    });
  }
  if (displayMode === 'progressHeat') {
    material = heatmapMaterial(progressHeatColor(el.progress ?? 0.5));
  }

  return (
    <group position={mid} rotation={[0, rotY, 0]}>
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onSelect?.(el); }}
      >
        <boxGeometry args={[len, height, thickness]} />
        <primitive object={material} attach="material" />
        {selected && <Edges color="#22d3ee" threshold={15} />}
      </mesh>
      {showLabels && el.qs?.id && (
        <Html distanceFactor={12} position={[0, el.height * 0.6, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bim-qs-label">
            <strong>{el.qs.id}</strong>
            {el.qs.brickQty != null && <span>Brick: {el.qs.brickQty}</span>}
            {el.qs.cost > 0 && <span>LKR {el.qs.cost.toLocaleString()}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

function FootprintMesh({ el, selected, onSelect, displayMode, maxCost, showLabels, yOffset = 0 }) {
  const geometry = useMemo(() => {
    if (!el.shape?.length || el.shape.length < 3) return null;
    const shape = new THREE.Shape();
    el.shape.forEach((p, i) => {
      if (i === 0) shape.moveTo(p.x, p.z);
      else shape.lineTo(p.x, p.z);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: el.height,
      bevelEnabled: el.category !== 'parking',
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 1,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, 0);
    return geo;
  }, [el]);

  if (!geometry) return null;

  let material = getBimMaterial(el.material, {
    wireframe: displayMode === 'wireframe',
    transparent: displayMode === 'xray' || el.category === 'parking',
    opacity: displayMode === 'xray' ? 0.4 : el.category === 'parking' ? 0.92 : 1,
  });
  if (displayMode === 'costHeat' && el.qs?.cost) {
    material = heatmapMaterial(costHeatColor(el.qs.cost, maxCost));
  }

  const cx = el.center[0];
  const cy = el.center[1] + yOffset;
  const cz = el.center[2];

  return (
    <group position={[cx, cy - el.height / 2, cz]}>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onSelect?.(el); }}
      >
        <primitive object={material} attach="material" />
        {selected && <Edges color="#22d3ee" />}
      </mesh>
      {el.showVehicle && <VehicleMesh />}
      {showLabels && el.qs?.id && (
        <Html position={[0, el.height + 0.5, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <div className="bim-qs-label">
            <strong>{el.qs.id}</strong>
            {el.qs.areaM2 != null && <span>{el.qs.areaM2} m²</span>}
            {el.qs.cost > 0 && <span>LKR {el.qs.cost.toLocaleString()}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

function VehicleMesh() {
  return (
    <mesh position={[0, 0.35, 0]} castShadow>
      <boxGeometry args={[1.8, 0.5, 3.8]} />
      <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
    </mesh>
  );
}

function ColumnMesh({ el, selected, onSelect, displayMode, maxCost, showLabels, yOffset = 0 }) {
  let material = getBimMaterial('concrete', { wireframe: displayMode === 'wireframe' });
  if (displayMode === 'costHeat') material = heatmapMaterial(costHeatColor(el.qs?.cost || 0, maxCost));

  return (
    <group position={[el.center[0], el.center[1] + yOffset, el.center[2]]}>
      <mesh
        castShadow
        onClick={(e) => { e.stopPropagation(); onSelect?.(el); }}
      >
        <cylinderGeometry args={[el.diameter / 2, el.diameter / 2, el.height, 20]} />
        <primitive object={material} attach="material" />
        {selected && <Edges color="#22d3ee" />}
      </mesh>
      {showLabels && el.qs?.id && (
        <Html position={[0, el.height * 0.55, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div className="bim-qs-label">
            <strong>{el.qs.id}</strong>
            {el.qs.concreteM3 != null && <span>Conc: {el.qs.concreteM3} m³</span>}
            {el.qs.steelKg != null && <span>Steel: {el.qs.steelKg} kg</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

function StairMesh({ el, selected, onSelect, yOffset = 0 }) {
  const steps = el.qs?.steps || 16;
  const stepH = el.height / steps;
  const stepD = el.depth / steps;

  return (
    <group position={[el.center[0], el.center[1] + yOffset, el.center[2]]}>
      {Array.from({ length: steps }, (_, i) => (
        <mesh
          key={i}
          position={[0, i * stepH, -el.depth / 2 + i * stepD + stepD / 2]}
          castShadow
          onClick={(e) => { e.stopPropagation(); onSelect?.(el); }}
        >
          <boxGeometry args={[el.width, stepH, stepD]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.75} metalness={0.1} />
        </mesh>
      ))}
      <mesh position={[el.width / 2 + 0.05, el.height / 2, 0]}>
        <boxGeometry args={[0.06, el.height, el.depth]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
      </mesh>
      {selected && (
        <mesh position={[0, el.height / 2, 0]}>
          <boxGeometry args={[el.width + 0.2, el.height, el.depth + 0.2]} />
          <meshBasicMaterial wireframe color="#22d3ee" />
        </mesh>
      )}
    </group>
  );
}

function LiftMesh({ el, selected, onSelect, yOffset = 0 }) {
  return (
    <group position={[el.center[0], el.center[1] + yOffset, el.center[2]]}>
      <mesh castShadow onClick={(e) => { e.stopPropagation(); onSelect?.(el); }}>
        <boxGeometry args={[el.width, el.height, el.depth]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} metalness={0.15} transparent opacity={0.85} />
        <Edges color="#475569" />
      </mesh>
      <mesh position={[0, el.height * 0.35, 0]}>
        <boxGeometry args={[el.width * 0.6, el.height * 0.5, el.depth * 0.55]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.25} />
      </mesh>
      {selected && <Edges color="#22d3ee" threshold={10} />}
    </group>
  );
}

function RampMesh({ el, selected, onSelect, yOffset = 0 }) {
  const curve = useMemo(() => {
    const points = [];
    const sweep = (el.endAngle ?? Math.PI) - (el.startAngle ?? 0);
    const steps = 24;
    for (let i = 0; i <= steps; i += 1) {
      const t = (el.startAngle ?? 0) + (sweep * i) / steps;
      points.push(
        new THREE.Vector3(
          el.center[0] + Math.cos(t) * el.radius,
          el.center[1] + yOffset + i * el.slope * 0.15,
          el.center[2] + Math.sin(t) * el.radius,
        ),
      );
    }
    return new THREE.CatmullRomCurve3(points);
  }, [el, yOffset]);

  return (
    <mesh
      onClick={(e) => { e.stopPropagation(); onSelect?.(el); }}
      castShadow
      receiveShadow
    >
      <tubeGeometry args={[curve, 48, el.width / 2, 8, false]} />
      <meshStandardMaterial color="#9ca3af" roughness={0.75} metalness={0.1} />
      {selected && <Edges color="#22d3ee" />}
    </mesh>
  );
}

function PlanOutline({ lines, visible, emphasis = false }) {
  const geom = useMemo(() => {
    if (!lines?.length) return null;
    const positions = new Float32Array(lines.length * 6);
    lines.forEach((ln, i) => {
      const o = i * 6;
      positions[o] = ln.start[0];
      positions[o + 1] = ln.start[1];
      positions[o + 2] = ln.start[2];
      positions[o + 3] = ln.end[0];
      positions[o + 4] = ln.end[1];
      positions[o + 5] = ln.end[2];
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [lines]);

  if (!visible || !geom) return null;
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial
        color={emphasis ? '#35e7ff' : '#94a3b8'}
        transparent
        opacity={emphasis ? 0.72 : 0.42}
      />
    </lineSegments>
  );
}

export default function BIMModel({
  elements = [],
  planOutline = [],
  selectedId,
  onSelect,
  displayMode = 'architectural',
  constructionProgress = 1,
  showLabels = false,
  floorOffsets = {},
  showPlanOverlay = false,
  bimDiscipline = 'architectural',
}) {
  const maxCost = useMemo(
    () => Math.max(...elements.map((e) => e.qs?.cost || 0), 1),
    [elements],
  );

  const visible = useMemo(() => {
    const filtered = elements.filter((el) => {
      if (!categoryVisibleAtProgress(el.category, constructionProgress)) return false;
      if (bimDiscipline === 'structural') {
        return ['column', 'wall', 'slab', 'grid', 'stair', 'lift'].includes(el.category);
      }
      if (bimDiscipline === 'mep') {
        return ['service', 'lift', 'corridor'].includes(el.category);
      }
      return true;
    });
    if (filtered.length === 0 && elements.length > 0) {
      return elements;
    }
    return filtered;
  }, [elements, constructionProgress, bimDiscipline]);

  const planEmphasis = constructionProgress < 0.25 && visible.length < 12;

  return (
    <group>
      <PlanOutline lines={planOutline} visible={showPlanOverlay} emphasis={planEmphasis} />
      {visible.map((el) => {
        const yOff = floorOffsets[el.floorId] || 0;
        const selected = selectedId === el.id;
        const key = el.id;

        if (el.geomType === 'segment') {
          return (
            <WallSegment
              key={key}
              el={el}
              selected={selected}
              onSelect={onSelect}
              displayMode={displayMode}
              maxCost={maxCost}
              showLabels={showLabels}
            />
          );
        }
        if (el.geomType === 'footprint') {
          return (
            <FootprintMesh
              key={key}
              el={el}
              selected={selected}
              onSelect={onSelect}
              displayMode={displayMode}
              maxCost={maxCost}
              showLabels={showLabels}
              yOffset={yOff}
            />
          );
        }
        if (el.geomType === 'column') {
          return (
            <ColumnMesh
              key={key}
              el={el}
              selected={selected}
              onSelect={onSelect}
              displayMode={displayMode}
              maxCost={maxCost}
              showLabels={showLabels}
              yOffset={yOff}
            />
          );
        }
        if (el.geomType === 'stair') {
          return <StairMesh key={key} el={el} selected={selected} onSelect={onSelect} yOffset={yOff} />;
        }
        if (el.geomType === 'lift') {
          return <LiftMesh key={key} el={el} selected={selected} onSelect={onSelect} yOffset={yOff} />;
        }
        if (el.geomType === 'rampArc') {
          return <RampMesh key={key} el={el} selected={selected} onSelect={onSelect} yOffset={yOff} />;
        }
        return null;
      })}
    </group>
  );
}
