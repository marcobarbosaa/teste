import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import type { PlayerId } from '@x1/shared';
import type { GameConnection } from '../network/GameConnection';

export function Player({ id, connection }: { id: PlayerId; connection: GameConnection }) {
  const group = useRef<Group>(null);
  const initialized = useRef(false);
  const color = id === 'p1' ? '#ef8b54' : '#92b9eb';
  useFrame((_, delta) => {
    const point = connection.sample(id, performance.now());
    if (!point || !group.current) return;
    const t = initialized.current ? 1 - Math.exp(-22 * Math.min(delta, 0.1)) : 1;
    group.current.position.x += (point.x - group.current.position.x) * t;
    group.current.position.z += (point.z - group.current.position.z) * t;
    initialized.current = true;
  });
  return <group ref={group}>
    <mesh position={[0, 1.66, 0]} castShadow><sphereGeometry args={[0.21, 16, 12]}/><meshStandardMaterial color={id === 'p1' ? '#ad7353' : '#754e3a'}/></mesh>
    <mesh position={[0, 1.12, 0]} castShadow><capsuleGeometry args={[0.26, 0.48, 4, 12]}/><meshStandardMaterial color={color}/></mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 0.35, 1.08, 0]} rotation={[0, 0, side * 0.12]} castShadow><capsuleGeometry args={[0.085, 0.52, 4, 8]}/><meshStandardMaterial color={id === 'p1' ? '#ad7353' : '#754e3a'}/></mesh>
      <mesh position={[side * 0.15, 0.4, 0]} castShadow><capsuleGeometry args={[0.11, 0.55, 4, 8]}/><meshStandardMaterial color="#202b2c"/></mesh>
      <mesh position={[side * 0.15, 0.09, -0.08]} scale={[1, 0.6, 1.7]} castShadow><sphereGeometry args={[0.13, 12, 8]}/><meshStandardMaterial color="#ece9d9"/></mesh>
    </group>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}><ringGeometry args={[0.38, 0.43, 32]}/><meshBasicMaterial color={color}/></mesh>
    <mesh position={[0, 1.23, -0.265]}><planeGeometry args={[0.1, 0.23]}/><meshBasicMaterial color="#fff4de"/></mesh>
  </group>;
}

