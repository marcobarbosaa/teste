import type { FootState, LocomotionState, MovementInput, Vec3, VisualPlayer } from './types';
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const clamp=(v:number,max:number)=>Math.max(-max,Math.min(max,v));
export function localPoint(p:VisualPlayer,v:Vec3):Vec3 { return {x:p.x+v.x*Math.cos(p.yaw)+v.z*Math.sin(p.yaw),y:v.y+(p.y??0),z:p.z-v.x*Math.sin(p.yaw)+v.z*Math.cos(p.yaw)}; }
export function createLocomotion(p:VisualPlayer):LocomotionState {
  const foot=(side:number):FootState=>{const position=localPoint(p,{x:side*.15,y:.10,z:0});return {position,plant:{...position},from:{...position},stance:true};};
  return {kind:'idle',cycle:.25,weight:0,forward:0,lateral:0,leanX:0,leanZ:0,twist:0,left:foot(-1),right:foot(1)};
}
export function stepLocomotion(p:VisualPlayer,velocity:{x:number;z:number},acceleration:{x:number;z:number},input:MovementInput,dt:number) {
  const l=p.locomotion??(p.locomotion=createLocomotion(p)), blend=1-Math.exp(-12*dt);
  const forward=-Math.sin(p.yaw)*velocity.x-Math.cos(p.yaw)*velocity.z;
  const lateral=Math.cos(p.yaw)*velocity.x-Math.sin(p.yaw)*velocity.z;
  const braking=Math.hypot(input.x,input.z)<.1;
  const reversal=velocity.x*acceleration.x+velocity.z*acceleration.z < -8 && !braking;
  l.kind=p.speed<.08 ? l.weight>.04?'stop':'idle' : braking?'stop':reversal?'pivot':Math.abs(lateral)>Math.abs(forward)*.9?'strafe':forward<-.3?'backpedal':input.sprint && p.speed>4?'run':'walk';
  l.weight=mix(l.weight,Math.min(1,p.speed/1.5),blend);l.forward=forward;l.lateral=lateral;
  l.leanX=mix(l.leanX,clamp(-forward*.018-(-Math.sin(p.yaw)*acceleration.x-Math.cos(p.yaw)*acceleration.z)*.005,.21),blend);
  l.leanZ=mix(l.leanZ,clamp(-lateral*.022-(Math.cos(p.yaw)*acceleration.x-Math.sin(p.yaw)*acceleration.z)*.004,.20),blend);
  l.twist=mix(l.twist,clamp(lateral*.04,.18),blend);
  l.cycle+=p.speed*dt/(.9+p.speed*.35);
  p.gait=l.cycle*Math.PI*2;
  for(const [foot,side,offset] of [[l.left,-1,0],[l.right,1,.5]] as const) {
    const support=p.speed>4?.34:.5;
    const phase=(l.cycle+offset)%1, stance=phase<support;
    const neutral=localPoint(p,{x:side*.15,y:.10,z:0});
    if(p.speed<.12) {
      foot.position={x:mix(foot.position.x,neutral.x,blend),y:mix(foot.position.y,.10,blend),z:mix(foot.position.z,neutral.z,blend)};
      foot.plant={...foot.position};foot.from={...foot.position};foot.stance=true;continue;
    }
    if(stance && !foot.stance)foot.plant={...foot.position,y:.10};
    if(!stance && foot.stance)foot.from={...foot.position};
    foot.stance=stance;
    if(stance)foot.position={...foot.plant};
    else {
      const u=(phase-support)/(1-support), t=u*u*(3-2*u);
      const ahead=(.9+p.speed*.35)/Math.max(.1,p.speed)*support*.5;
      foot.position={x:mix(foot.from.x,neutral.x+velocity.x*ahead,t),z:mix(foot.from.z,neutral.z+velocity.z*ahead,t),y:.10+Math.sin(Math.PI*u)*(l.kind==='run'?.22:.12)};
    }
    // Reposicionamento de segurança ao atingir a extensão máxima da perna.
    const dx=foot.position.x-p.x,dz=foot.position.z-p.z,d=Math.hypot(dx,dz);
    if(d>.59){foot.position.x=p.x+dx/d*.59;foot.position.z=p.z+dz/d*.59;foot.plant={...foot.position};}
  }
}
/** Cinemática inversa de dois segmentos, sem dependência do renderizador. */
export function solveJoint(root:Vec3,end:Vec3,upper:number,lower:number,pole:Vec3):Vec3 {
  const delta={x:end.x-root.x,y:end.y-root.y,z:end.z-root.z};
  const raw=Math.max(1e-6,Math.hypot(delta.x,delta.y,delta.z)), d=Math.min(raw,upper+lower-.0001);
  const n={x:delta.x/raw,y:delta.y/raw,z:delta.z/raw};
  const dot=pole.x*n.x+pole.y*n.y+pole.z*n.z;
  let b={x:pole.x-n.x*dot,y:pole.y-n.y*dot,z:pole.z-n.z*dot};
  let length=Math.hypot(b.x,b.y,b.z);if(length<1e-5){b={x:1,y:0,z:0};length=1;}
  const along=(upper*upper-lower*lower+d*d)/(2*d), height=Math.sqrt(Math.max(0,upper*upper-along*along));
  return {x:root.x+n.x*along+b.x/length*height,y:root.y+n.y*along+b.y/length*height,z:root.z+n.z*along+b.z/length*height};
}
