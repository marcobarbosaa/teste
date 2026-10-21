import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { angleDelta, type PlayerId } from '@x1/shared';
import type { GameController } from '../game/GameController';

function Limb({ skin, leg = false }: { skin: string; leg?: boolean }) {
  return <>
    <mesh position={[0, -.16, 0]} castShadow><capsuleGeometry args={[leg ? .105 : .075, .2, 4, 8]}/><meshStandardMaterial color={leg ? '#273b46' : skin}/></mesh>
    <mesh position={[0, -.42, 0]} castShadow><capsuleGeometry args={[leg ? .077 : .065, .2, 4, 8]}/><meshStandardMaterial color={skin}/></mesh>
    {leg ? <mesh position={[0, -.64, -.06]} scale={[1, .6, 1.7]} castShadow><sphereGeometry args={[.12, 12, 8]}/><meshStandardMaterial color="#e7e6d9"/></mesh>
      : <mesh position={[0, -.59, 0]}><sphereGeometry args={[.075, 10, 8]}/><meshStandardMaterial color={skin}/></mesh>}
  </>;
}
export function Player({ id, controller }: { id: PlayerId; controller: GameController }) {
  const group = useRef<Group>(null), body = useRef<Group>(null);
  const leftArm = useRef<Group>(null), rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null), rightLeg = useRef<Group>(null);
  const initialized = useRef(false);
  const color = id === 'p1' ? '#d66f3b' : '#7ca8d4';
  const skin = id === 'p1' ? '#b77b59' : '#794e38';
  useFrame((_, delta) => {
    const p = controller.samplePlayer(id, performance.now());
    if (!p || !group.current || !body.current) return;
    const blend = initialized.current ? 1 - Math.exp(-25 * Math.min(delta, .1)) : 1;
    group.current.position.x += (p.x - group.current.position.x) * blend;
    group.current.position.z += (p.z - group.current.position.z) * blend;
    group.current.rotation.y += angleDelta(group.current.rotation.y, p.yaw) * blend;
    const stride = Math.sin(p.gait) * Math.min(p.speed / 6, 1) * .65;
    const shooting = p.pose === 'charge' || p.pose === 'release';
    const shotPose = p.pose === 'release' ? Math.max(0, 1 - p.actionTime / .65) : 1;
    body.current.position.y = shooting ? (p.pose === 'charge' ? -.06 : Math.sin(Math.min(1, p.actionTime / .45) * Math.PI) * .13) : Math.abs(Math.sin(p.gait)) * Math.min(p.speed, 4) * .006;
    if (leftLeg.current) leftLeg.current.rotation.x = shooting ? -.08 : stride;
    if (rightLeg.current) rightLeg.current.rotation.x = shooting ? -.08 : -stride;
    if (leftArm.current) {
      leftArm.current.rotation.x = shooting ? 2.45 * shotPose : -.65 * stride;
      leftArm.current.rotation.z = shooting ? .42 * shotPose : .09;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = shooting ? 2.5 * shotPose : p.hasBall ? .5 + Math.max(0, p.handHeight - .85) * .9 : .65 * stride;
      rightArm.current.rotation.z = shooting ? -.42 * shotPose : p.hasBall ? -.24 : -.09;
    }
    initialized.current = true;
  });
  return <group ref={group} name={'player-' + id}>
    <group ref={body}>
      <mesh position={[0, 1.65, 0]} castShadow><sphereGeometry args={[.19, 16, 12]}/><meshStandardMaterial color={skin}/></mesh>
      <mesh position={[0, 1.76, .015]} scale={[1, .55, 1]} castShadow><sphereGeometry args={[.191, 12, 8]}/><meshStandardMaterial color="#342f2b"/></mesh>
      <mesh position={[0, 1.46, 0]}><cylinderGeometry args={[.085, .09, .17, 8]}/><meshStandardMaterial color={skin}/></mesh>
      <mesh position={[0, 1.12, 0]} scale={[1, 1, .8]} castShadow><capsuleGeometry args={[.245, .39, 5, 12]}/><meshStandardMaterial color={color}/></mesh>
      <mesh position={[0, .79, 0]} castShadow><capsuleGeometry args={[.22, .08, 4, 12]}/><meshStandardMaterial color="#273b46"/></mesh>
      <group ref={leftArm} position={[-.3, 1.36, 0]} rotation={[0, 0, .09]}><Limb skin={skin}/></group>
      <group ref={rightArm} position={[.3, 1.36, 0]} rotation={[0, 0, -.09]}><Limb skin={skin}/></group>
      <group ref={leftLeg} position={[-.13, .72, 0]}><Limb skin={skin} leg/></group>
      <group ref={rightLeg} position={[.13, .72, 0]}><Limb skin={skin} leg/></group>
      {[.18, -.2].map(z => <mesh key={z} position={[0, 1.15, z]} rotation={[0, z > 0 ? 0 : Math.PI, 0]}><planeGeometry args={[.055, .19]}/><meshBasicMaterial color="#f4dfb4"/></mesh>)}
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .043, 0]}><ringGeometry args={[.39, .415, 40]}/><meshBasicMaterial color="#f5dcb6" transparent opacity={.65}/></mesh>
  </group>;
}
