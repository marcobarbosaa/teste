import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Group } from 'three';
import { BALL, HOOP } from '@x1/shared';
import type { GameController } from '../game/GameController';
export function PhysicsDebug({controller}:{controller:GameController}) {
  const sphere=useRef<Group>(null);
  const trail=useMemo(()=>new BufferGeometry().setAttribute('position',new Float32BufferAttribute(new Float32Array(360*3),3)),[]);
  const normal=useMemo(()=>new BufferGeometry().setAttribute('position',new Float32BufferAttribute(new Float32Array(6),3)),[]);
  const count=useRef(0);
  useFrame(()=>{
    const ball=controller.sampleBall?.(); if(!ball)return;
    sphere.current?.position.set(ball.position.x,ball.position.y,ball.position.z);
    const p=trail.getAttribute('position'), n=count.current++%360;
    p.setXYZ(n,ball.position.x,ball.position.y,ball.position.z); p.needsUpdate=true;
    trail.setDrawRange(0,Math.min(count.current,360));
    if(ball.contactPoint && ball.contactNormal){const a=normal.getAttribute('position'),c=ball.contactPoint,d=ball.contactNormal;a.setXYZ(0,c.x,c.y,c.z);a.setXYZ(1,c.x+d.x*.65,c.y+d.y*.65,c.z+d.z*.65);a.needsUpdate=true;}
    const label=document.getElementById('physics-contact'); if(label)label.textContent='Contato: '+ball.lastContact+' · #'+ball.contactSerial;
  });
  return <group>
    <mesh position={[HOOP.x,HOOP.boardY,HOOP.boardZ]}><boxGeometry args={[HOOP.boardWidth,HOOP.boardHeight,HOOP.boardDepth]}/><meshBasicMaterial color="#ff55ff" wireframe depthTest={false}/></mesh>
    <group ref={sphere}><mesh><sphereGeometry args={[BALL.radius,12,8]}/><meshBasicMaterial color="#55ff99" wireframe depthTest={false}/></mesh></group>
    <lineSegments geometry={trail} frustumCulled={false}><lineBasicMaterial color="#ffdf66" depthTest={false}/></lineSegments>
    <lineSegments geometry={normal} frustumCulled={false}><lineBasicMaterial color="#ff3355" depthTest={false}/></lineSegments>
  </group>;
}
