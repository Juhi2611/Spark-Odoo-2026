import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function latLngToVec3(lat, lng, r = 2.2) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

const CITIES = [
  [40.7, -74, "NYC"], [51.5, -0.1, "LON"], [35.7, 139.7, "TYO"],
  [1.35, 103.8, "SGP"], [-33.9, 151.2, "SYD"], [19.4, -99.1, "MEX"],
  [55.7, 37.6, "MOS"], [-23.5, -46.6, "SAO"], [25.2, 55.3, "DXB"],
  [48.85, 2.35, "PAR"], [37.77, -122.4, "SFO"], [22.3, 114.16, "HKG"],
];

const ROUTES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [7, 0],
  [6, 8], [9, 1], [10, 0], [11, 2], [8, 9], [4, 11], [10, 5],
];

function ArcRoute({ from, to, delay = 0 }) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const dist = from.distanceTo(to);
  mid.normalize().multiplyScalar(2.2 + dist * 0.35);
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  const points = useMemo(() => curve.getPoints(50), [from, to]);
  const dashRef = useRef(null);
  useFrame(({ clock }) => {
    if (dashRef.current) {
      dashRef.current.material.dashOffset = -(clock.elapsedTime * 0.4 + delay);
    }
  });
  return (
    <>
      <Line points={points} color="#3B82F6" lineWidth={0.8} transparent opacity={0.25} />
      <Line ref={dashRef} points={points} color="#60A5FA" lineWidth={1.5} dashed dashSize={0.15} gapSize={0.4} transparent opacity={0.9} />
    </>
  );
}

function Globe() {
  const ref = useRef(null);
  useFrame(({ clock, mouse }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.08 + mouse.x * 0.3;
      ref.current.rotation.x = mouse.y * 0.15;
    }
  });
  const cityVecs = CITIES.map(([lat, lng]) => latLngToVec3(lat, lng));
  return (
    <group ref={ref}>
      {/* Wireframe sphere */}
      <mesh>
        <sphereGeometry args={[2.2, 32, 24]} />
        <meshBasicMaterial color="#1e3a5f" wireframe transparent opacity={0.35} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.19, 48, 32]} />
        <meshBasicMaterial color="#0B0F1A" transparent opacity={0.85} />
      </mesh>
      {/* Cities */}
      {cityVecs.map((v, i) => (
        <group key={i} position={v}>
          <mesh>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#F59E0B" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.25} />
          </mesh>
        </group>
      ))}
      {/* Routes */}
      {ROUTES.map(([a, b], i) => (
        <ArcRoute key={i} from={cityVecs[a]} to={cityVecs[b]} delay={i * 0.3} />
      ))}
    </group>
  );
}

function TruckMesh({ path, speed = 0.1, offset = 0 }) {
  const ref = useRef(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path, true), [path]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.elapsedTime * speed + offset) % 1);
    const p = curve.getPointAt(t);
    ref.current.position.copy(p);
    const tan = curve.getTangentAt(t);
    ref.current.lookAt(p.clone().add(tan));
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.14, 0.08, 0.08]} />
      <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={0.6} />
    </mesh>
  );
}

export default function HeroScene({ compact = false }) {
  const orbitPath = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 2.6, Math.sin(a * 2) * 0.4, Math.sin(a) * 2.6));
    }
    return pts;
  }, []);
  return (
    <Canvas
      camera={{ position: [0, 0.5, 6.5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#3B82F6" />
      <pointLight position={[-5, -3, 2]} intensity={0.5} color="#F59E0B" />
      <Stars radius={40} depth={30} count={compact ? 800 : 2500} factor={3} fade speed={0.5} />
      <Float speed={1} rotationIntensity={0.15} floatIntensity={0.3}>
        <Globe />
      </Float>
      {!compact && (
        <>
          <TruckMesh path={orbitPath} speed={0.06} offset={0} />
          <TruckMesh path={orbitPath} speed={0.06} offset={0.33} />
          <TruckMesh path={orbitPath} speed={0.06} offset={0.66} />
        </>
      )}
    </Canvas>
  );
}
