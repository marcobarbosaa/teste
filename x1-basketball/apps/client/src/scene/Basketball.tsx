import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { BALL } from '@x1/shared';
import type { GameController } from '../game/GameController';

export function Basketball({ controller }: { controller: GameController }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const ball = controller.sampleBall?.();
    if (!group.current || !ball) return;
    group.current.position.set(ball.position.x, ball.position.y, ball.position.z);
    group.current.rotation.set(ball.spin, ball.spin * .21, .3);
  });
  return <group ref={group} name="basketball">
    <mesh castShadow><sphereGeometry args={[BALL.radius-.0018, 32, 24]}/><meshStandardMaterial color="#cb641f" roughness={.86}/></mesh>
    {[[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0], [0, Math.PI / 4, 0]].map((rotation, i) =>
      <mesh key={i} rotation={rotation as [number, number, number]}><torusGeometry args={[BALL.radius-.0018, .0018, 4, 64]}/><meshStandardMaterial color="#30281f" roughness={1}/></mesh>)}
  </group>;
}
