import { useMemo } from 'react';
import { HOOP } from '@x1/shared';
import { Wire } from './geometry';

export function BasketballHoop() {
  const net = useMemo(() => {
    const points: number[] = [];
    const point = (i: number, row: number) => {
      const angle = i / 12 * Math.PI * 2 + (row % 2) * Math.PI / 12;
      const radius = HOOP.radius * (1 - row * 0.085);
      return [Math.sin(angle) * radius, -row * 0.085, Math.cos(angle) * radius];
    };
    for (let row = 0; row < 5; row++) for (let i = 0; i < 12; i++) {
      points.push(...point(i, row), ...point(i, row + 1));
      points.push(...point(i, row), ...point(i + (row % 2 ? 0 : -1), row + 1));
    }
    return points;
  }, []);
  return <group name="basketball-hoop">
    <mesh position={[0, 1.75, HOOP.postZ]} castShadow><cylinderGeometry args={[0.14, 0.19, 3.5, 12]}/><meshStandardMaterial color="#334b50" roughness={0.65}/></mesh>
    <mesh position={[0, .58, HOOP.postZ]} castShadow><boxGeometry args={[.55, 1.16, .55]}/><meshStandardMaterial color="#cf7551"/></mesh>
    <mesh position={[0, 3.48, (HOOP.postZ + HOOP.boardZ) / 2]} castShadow><boxGeometry args={[.2, .2, HOOP.boardZ - HOOP.postZ]}/><meshStandardMaterial color="#334b50"/></mesh>
    <mesh position={[0, HOOP.boardY, HOOP.boardZ]} castShadow><boxGeometry args={[HOOP.boardWidth, HOOP.boardHeight, HOOP.boardDepth]}/><meshStandardMaterial color="#e6e9dc" roughness={0.4}/></mesh>
    <group position={[0, HOOP.boardY, HOOP.boardZ + HOOP.boardDepth / 2 + .006]}>
      {[[-.88, 0, .025, 1.03], [.88, 0, .025, 1.03], [0, .51, 1.78, .025], [0, -.51, 1.78, .025],
        [-.3, -.12, .025, .43], [.3, -.12, .025, .43], [0, .09, .6, .025], [0, -.33, .6, .025]].map(([x, y, w, h], i) =>
        <mesh key={i} position={[x, y, 0]}><planeGeometry args={[w, h]}/><meshBasicMaterial color="#c1613d"/></mesh>)}
    </group>
    <mesh position={[0, HOOP.y, (HOOP.boardZ + HOOP.z - HOOP.radius) / 2]}><boxGeometry args={[.13, .055, HOOP.z - HOOP.radius - HOOP.boardZ]}/><meshStandardMaterial color="#d56837"/></mesh>
    <mesh position={[HOOP.x, HOOP.y, HOOP.z]} rotation={[-Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[HOOP.radius, HOOP.tube, 8, 48]}/><meshStandardMaterial color="#ea7436" metalness={0.25} roughness={0.45}/></mesh>
    <group position={[HOOP.x, HOOP.y - .02, HOOP.z]}><Wire segments={net} color="#e9e5d4"/></group>
  </group>;
}

