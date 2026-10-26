import { BALL, HOOP, SHOT, PRECISION, CONTACT } from './config';
import { angleDelta, towardHoopYaw } from './motion';
import { nextRandom } from './random';
import type { FinishKind, Vec3, VisualPlayer } from './types';
export const shotMeter=(elapsed:number)=>Math.max(0,Math.min(1,elapsed/SHOT.chargeSeconds));
export function releaseQuality(meter:number){
  const error=meter-SHOT.ideal;
  return Math.abs(error)<=PRECISION.excellent?'Excelente':Math.abs(error)<=SHOT.greenHalfWidth?'Boa soltura':error<0?'Muito cedo':'Muito tarde';
}
export function ballisticVelocity(origin:Vec3,target:Vec3,apex:number):Vec3 {
  const vy=Math.sqrt(2*BALL.gravity*Math.max(.02,apex-origin.y));
  const time=vy/BALL.gravity+Math.sqrt(2*Math.max(.02,apex-target.y)/BALL.gravity);
  return {x:(target.x-origin.x)/time,y:vy,z:(target.z-origin.z)/time};
}
export function bankVelocity(origin:Vec3,target:Vec3,apex=3.72):Vec3 {
  const direct=ballisticVelocity(origin,target,Math.max(apex,origin.y+.12));
  const total=(direct.y+Math.sqrt(Math.max(0,direct.y*direct.y-2*BALL.gravity*(target.y-origin.y))))/BALL.gravity;
  const plane=HOOP.boardZ+HOOP.boardDepth/2+BALL.radius;
  const before=origin.z-plane,after=target.z-plane;
  if(before<=BALL.radius || after<=0)return direct;
  return {x:direct.x,y:direct.y,z:-(before+after/CONTACT.boardRestitution)/total};
}
export function shotVelocity(origin:Vec3,player:VisualPlayer,meter:number,seed:number,kind:FinishKind='jump_shot',bank=false):Vec3 {
  const distance=Math.hypot(origin.x-HOOP.x,origin.z-HOOP.z);
  const raw=meter-SHOT.ideal;
  const timing=Math.abs(raw)<=SHOT.greenHalfWidth?raw*PRECISION.greenScale:Math.sign(raw)*(SHOT.greenHalfWidth*PRECISION.greenScale+(Math.abs(raw)-SHOT.greenHalfWidth)*1.4);
  const orientation=angleDelta(player.yaw,towardHoopYaw(player.x,player.z));
  const moving=player.speed*PRECISION.movement*PRECISION.movementScale[kind];
  const spread=(PRECISION.spread+Math.max(0,distance-5)*PRECISION.distance+moving+Math.abs(orientation)*PRECISION.orientation)*PRECISION.finishScale[kind];
  const a=nextRandom(seed),b=nextRandom(a.seed);
  const xError=timing*PRECISION.timing+(a.value*2-1)*spread;
  const zError=timing*1.4+(b.value*2-1)*spread*.45;
  const target={x:HOOP.x+xError,y:HOOP.y,z:HOOP.z+zError};
  if(kind==='dunk')return {x:(HOOP.x-origin.x)*5,y:-3.2,z:(HOOP.z-origin.z)*5};
  const apex=kind==='jump_shot'?Math.max(origin.y,HOOP.y)+2.4+distance*.11:Math.max(origin.y+.15,HOOP.y+(kind==='layup'?.72:.70));
  return bank?bankVelocity(origin,target,apex):ballisticVelocity(origin,target,apex);
}
