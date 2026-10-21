import { useMemo } from 'react';
import { COURT, HOOP } from '@x1/shared';
import { courtArc } from './geometry';
import { useSurfaceTexture } from './Surface';
function Stripe({ x, z, width, depth }: { x: number; z: number; width: number; depth: number }) {
  return <mesh position={[x, .038, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[width, depth]}/><meshBasicMaterial color="#eee9d1"/></mesh>;
}
export function Court() {
  const texture = useSurfaceTexture();
  const arcs = useMemo(() => {
    const alpha = Math.asin(COURT.cornerX / COURT.threeRadius);
    return [courtArc(COURT.threeRadius, -alpha, alpha, HOOP.z), courtArc(1.8, -Math.PI, Math.PI, COURT.freeThrowZ), courtArc(1.25, -Math.PI / 2, Math.PI / 2, HOOP.z), courtArc(1.8, Math.PI / 2, Math.PI * 1.5, COURT.maxZ)];
  }, []);
  const joinZ = HOOP.z + Math.sqrt(COURT.threeRadius ** 2 - COURT.cornerX ** 2);
  return <group name="half-court">
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[17, 16]}/><meshStandardMaterial color="#d2c7ae" map={texture} roughness={.95}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .012, 0]} receiveShadow><planeGeometry args={[15, 14]}/><meshStandardMaterial color="#547b78" map={texture} roughness={.95}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .023, (COURT.minZ + COURT.freeThrowZ) / 2]} receiveShadow><planeGeometry args={[COURT.laneWidth, COURT.freeThrowZ - COURT.minZ]}/><meshStandardMaterial color="#bd8261" map={texture} roughness={.95}/></mesh>
    {[-1, 1].map(side => <group key={side}>
      <Stripe x={side * (COURT.halfWidth - .025)} z={0} width={.05} depth={14}/>
      <Stripe x={side * COURT.laneWidth / 2} z={(COURT.minZ + COURT.freeThrowZ) / 2} width={.05} depth={COURT.freeThrowZ - COURT.minZ}/>
      <Stripe x={side * COURT.cornerX} z={(COURT.minZ + joinZ) / 2} width={.05} depth={joinZ - COURT.minZ}/>
      {[-5.2, -4.3, -3.4, -2.5].map(z => <Stripe key={z} x={side * (COURT.laneWidth / 2 + .13)} z={z} width={.25} depth={.05}/>)}
    </group>)}
    {[COURT.minZ + .025, COURT.maxZ - .025].map(z => <Stripe key={z} x={0} z={z} width={15} depth={.05}/>)}
    <Stripe x={0} z={COURT.freeThrowZ} width={COURT.laneWidth} depth={.05}/>
    {arcs.map((geometry, i) => <mesh geometry={geometry} key={i}><meshBasicMaterial color="#eee9d1" side={2}/></mesh>)}
  </group>;
}

