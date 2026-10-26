import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3 } from 'three';
import { solveJoint, type Vec3, type PlayerId } from '@x1/shared';
import type { GameController } from '../game/GameController';
const up=new Vector3(0,1,0), direction=new Vector3();
function segment(mesh:Mesh,a:Vec3,b:Vec3) {
  mesh.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);
  direction.set(b.x-a.x,b.y-a.y,b.z-a.z);
  mesh.scale.y=direction.length();mesh.quaternion.setFromUnitVectors(up,direction.normalize());
}
function poseLimb(group:Group|null,root:Vec3,end:Vec3,pole:Vec3,leg:boolean) {
  if(!group)return;
  const joint=solveJoint(root,end,leg?.4:.34,leg?.42:.34,pole);
  segment(group.children[0] as Mesh,root,joint);segment(group.children[1] as Mesh,joint,end);
  group.children[2].position.set(joint.x,joint.y,joint.z);
  group.children[3].position.set(end.x,end.y,end.z);
}
function Limb({skin,leg=false,limbRef}:{skin:string;leg?:boolean;limbRef:RefObject<Group|null>}) {
  return <group ref={limbRef}>
    <mesh castShadow><cylinderGeometry args={[leg?.105:.067,leg?.085:.06,1,8]}/><meshStandardMaterial color={leg?'#273b46':skin}/></mesh>
    <mesh castShadow><cylinderGeometry args={[leg?.08:.06,leg?.065:.05,1,8]}/><meshStandardMaterial color={skin}/></mesh>
    <mesh castShadow><sphereGeometry args={[leg?.085:.065,10,8]}/><meshStandardMaterial color={skin}/></mesh>
    {leg?<mesh scale={[1,.6,1.7]} castShadow><sphereGeometry args={[.12,12,8]}/><meshStandardMaterial color="#e7e6d9"/></mesh>
    :<mesh castShadow><sphereGeometry args={[.065,10,8]}/><meshStandardMaterial color={skin}/></mesh>}
  </group>;
}
export function PlayerRig({ id, controller }: { id: PlayerId; controller: GameController }) {
  const group=useRef<Group>(null),torso=useRef<Group>(null),hips=useRef<Group>(null);
  const groundRing=useRef<Mesh>(null);
  const crouchBlend=useRef(0);
  const leftArm=useRef<Group>(null),rightArm=useRef<Group>(null),leftLeg=useRef<Group>(null),rightLeg=useRef<Group>(null);
  const color=id==='p1'?'#d66f3b':'#7ca8d4',skin=id==='p1'?'#b77b59':'#794e38';
  useFrame((_,delta)=>{
    const p=controller.samplePlayer(id,performance.now());if(!p||!group.current||!torso.current||!hips.current)return;
    group.current.position.set(p.x,p.y??0,p.z);group.current.rotation.y=p.yaw;
    if(groundRing.current)groundRing.current.position.y=.043-(p.y??0);
    const l=p.locomotion,phase=p.gait,weight=l?.weight??0;
    const action=p.action;
    const crouch=(p.y??0)>.02?0:action?.phase==='landing'?.12:p.pose==='charge'?.09:Math.min(p.speed,6)*.014;
    crouchBlend.current+=(crouch-crouchBlend.current)*(1-Math.exp(-18*Math.min(.1,delta)));
    const hipY=.80-crouchBlend.current+Math.sin(phase*2)*.012*weight;
    hips.current.position.y=hipY;hips.current.rotation.y=l?.twist??0;
    torso.current.position.y=hipY+.33;
    const hesitation=action?.kind==='pump_fake'?Math.sin(action.elapsed/action.duration*Math.PI*2)*.12:0;
    torso.current.rotation.set(l?.leanX??0,(l?.twist??0)*.7+Math.sin(phase)*.035*weight+hesitation,l?.leanZ??0);
    const toLocal=(v:Vec3):Vec3=>{const dx=v.x-p.x,dz=v.z-p.z;return {x:dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw),y:v.y-(p.y??0),z:dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw)};};
    const airborne=(p.y??0)>.02;
    const left=action?{x:-.15,y:.1+(airborne?.14:0),z:action.hand===-1 && airborne?-.25:0}:l?toLocal(l.left.position):{x:-.15,y:.1,z:0};
    const right=action?{x:.15,y:.1+(airborne?.14:0),z:action.hand===1 && airborne?-.25:0}:l?toLocal(l.right.position):{x:.15,y:.1,z:0};
    poseLimb(leftLeg.current,{x:-.14,y:hipY,z:0},left,{x:0,y:0,z:-1},true);
    poseLimb(rightLeg.current,{x:.14,y:hipY,z:0},right,{x:0,y:0,z:-1},true);
    const ball=controller.sampleBall?.(),b=ball&&toLocal(ball.position);
    const shooting=p.pose==='charge'||p.pose==='release';
    const follow=p.pose==='release'?Math.max(0,1-p.actionTime/.65):0;
    let handRight:Vec3={x:.35,y:1.02,z:Math.sin(phase)*.22*weight};
    let handLeft:Vec3={x:-.35,y:1.02,z:-Math.sin(phase)*.22*weight};
    if(p.hasBall && b){
      handRight={x:b.x+.02,y:Math.max(.86,b.y+(shooting?-.07:.09)),z:b.z+.015};
      if(shooting)handLeft={x:b.x-.11,y:b.y-.035,z:b.z+.04};
      if(action && (action.kind==='layup'||action.kind==='dunk'||action.kind==='short_shot')){
        if(action.hand===-1){handLeft={x:b.x,y:b.y-.07,z:b.z};handRight={x:.38,y:1.13,z:-.1};}
        else handLeft={x:-.38,y:1.13,z:-.1};
      }
    } else if(follow>0){
      handRight={x:.12,y:1.02+follow*.95,z:-.30*follow};handLeft={x:-.15,y:1.02+follow*.85,z:-.25*follow};
      if(action?.kind==='layup'||action?.kind==='dunk'||action?.kind==='short_shot'){
        if(action.hand===-1){handLeft={...handRight,x:-.12};handRight={x:.38,y:1.13,z:-.1};}
        else handLeft={x:-.38,y:1.13,z:-.1};
      }
    }
    poseLimb(rightArm.current,{x:.27,y:hipY+.63,z:0},handRight,{x:.35,y:0,z:-1},false);
    poseLimb(leftArm.current,{x:-.27,y:hipY+.63,z:0},handLeft,{x:-.35,y:0,z:-1},false);
  });
  return <group ref={group} name={'player-'+id}>
    <group ref={torso}>
      <mesh scale={[1,1,.8]} castShadow><capsuleGeometry args={[.235,.32,5,12]}/><meshStandardMaterial color={color}/></mesh>
      <mesh position={[0,.34,0]}><cylinderGeometry args={[.08,.085,.17,8]}/><meshStandardMaterial color={skin}/></mesh>
      <mesh position={[0,.52,0]} castShadow><sphereGeometry args={[.18,16,12]}/><meshStandardMaterial color={skin}/></mesh>
      <mesh position={[0,.63,.015]} scale={[1,.55,1]} castShadow><sphereGeometry args={[.181,12,8]}/><meshStandardMaterial color="#342f2b"/></mesh>
      {[.19,-.19].map(z=><mesh key={z} position={[0,0,z]} rotation={[0,z>0?0:Math.PI,0]}><planeGeometry args={[.055,.18]}/><meshBasicMaterial color="#f4dfb4"/></mesh>)}
    </group>
    <group ref={hips}><mesh castShadow><capsuleGeometry args={[.21,.08,4,12]}/><meshStandardMaterial color="#273b46"/></mesh></group>
    <Limb limbRef={leftArm} skin={skin}/><Limb limbRef={rightArm} skin={skin}/>
    <Limb limbRef={leftLeg} skin={skin} leg/><Limb limbRef={rightLeg} skin={skin} leg/>
    <mesh ref={groundRing} rotation={[-Math.PI/2,0,0]} position={[0,.043,0]}><ringGeometry args={[.39,.415,40]}/><meshBasicMaterial color="#f5dcb6" transparent opacity={.65}/></mesh>
  </group>;
}
