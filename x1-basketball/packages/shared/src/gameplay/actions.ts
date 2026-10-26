import { BALL, FINISH, HOOP } from './config';
import { angleDelta,towardHoopYaw } from './motion';
import { localPoint } from './locomotion';
import type { ActionState, FinishKind, Vec3, VisualPlayer } from './types';
export const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
export function contextualFinish(p:VisualPlayer,v:{x:number;z:number}):FinishKind|null {
  const dx=HOOP.x-p.x,dz=HOOP.z-p.z,d=Math.hypot(dx,dz),speed=Math.hypot(v.x,v.z);
  const approach=d>.001&&speed>.001?(dx*v.x+dz*v.z)/(d*speed):0;
  const facing=Math.abs(angleDelta(p.yaw,towardHoopYaw(p.x,p.z)));
  if(!p.hasBall)return null;
  if(d>=FINISH.dunkMinRange && d<=FINISH.dunkRange && speed>=FINISH.dunkSpeed && approach>=FINISH.dunkApproach && facing<=FINISH.dunkFacing && Math.abs(p.x-HOOP.x)<FINISH.dunkSide && p.z>HOOP.z+.45)return 'dunk';
  if(d<=FINISH.layupRange && speed>=FINISH.layupSpeed && approach>=FINISH.layupApproach && facing<1.1 && p.z>HOOP.z+.15)return 'layup';
  return d<=FINISH.shortRange?'short_shot':null;
}
export function createAction(kind:ActionState['kind'],p:VisualPlayer,ball:Vec3,meter:number):ActionState {
  const hand=p.x<HOOP.x-.12?-1:1;
  const config=kind==='pump_fake'?null:FINISH[kind];
  const takeoff=config?.takeoff??0,jumpHeight=config?.height??0;
  const duration=config?takeoff+2*Math.sqrt(2*jumpHeight/BALL.gravity)+config.recovery:FINISH.fakeDuration;
  let end={x:p.x,z:p.z};
  if(kind==='dunk')end={x:HOOP.x-hand*.12,z:HOOP.z+.24};
  if(kind==='layup'){
    const target={x:HOOP.x+hand*.45,z:HOOP.z+.8},dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);
    const t=Math.min(1,(p.speed*.46+.25)/Math.max(.001,d));end={x:p.x+dx*t,z:p.z+dz*t};
  }
  return {kind,phase:'prepare',elapsed:0,releaseAt:config?.release??Infinity,duration,takeoff,jumpHeight,released:false,hand,bank:kind==='layup'&&Math.abs(p.x-HOOP.x)>.25,meter,speed:p.speed,startYaw:p.yaw,start:{x:p.x,z:p.z},end,ballStart:{...ball}};
}
export function actionPose(p:VisualPlayer,a:ActionState) {
  const t=smooth(a.elapsed/a.releaseAt);
  p.x=a.start.x+(a.end.x-a.start.x)*t;p.z=a.start.z+(a.end.z-a.start.z)*t;
  if(a.kind==='dunk')p.yaw=a.startYaw+angleDelta(a.startYaw,0)*t;
  const air=a.elapsed-a.takeoff,vy=Math.sqrt(2*BALL.gravity*a.jumpHeight);
  p.y=Math.max(0,vy*air-.5*BALL.gravity*air*air);
  if(air<0)p.y=0;
  a.phase=a.elapsed<a.takeoff?'prepare':!a.released?'execute':(p.y??0)>.03?'release':a.elapsed<a.duration-.08?'landing':'recover';
  if(a.kind==='pump_fake')a.phase=a.elapsed<.2?'prepare':a.elapsed<.34?'execute':'recover';
  p.pose=a.released?'release':'charge';
}
export function actionBallTarget(p:VisualPlayer,a:ActionState):Vec3 {
  if(a.kind==='pump_fake') {
    const lift=Math.sin(Math.PI*Math.min(1,a.elapsed/a.duration))**2;
    const home=localPoint(p,{x:.40,y:1.04,z:-.22});
    const high=localPoint(p,{x:.06,y:1.78,z:-.34});
    const base={x:a.ballStart.x+(home.x-a.ballStart.x)*smooth(a.elapsed/a.duration),y:a.ballStart.y+(home.y-a.ballStart.y)*smooth(a.elapsed/a.duration),z:a.ballStart.z+(home.z-a.ballStart.z)*smooth(a.elapsed/a.duration)};
    return {x:base.x+(high.x-base.x)*lift,y:base.y+(high.y-base.y)*lift,z:base.z+(high.z-base.z)*lift};
  }
  const local={x:a.kind==='jump_shot'?.06:a.hand*(a.kind==='dunk'?.12:.20),y:a.kind==='dunk'?2.08:a.kind==='layup'?1.99:1.98,z:a.kind==='dunk'?-.24:-.32};
  let target=localPoint(p,local);
  if(a.kind==='short_shot') {
    const dx=p.x-HOOP.x,dz=p.z-HOOP.z,d=Math.hypot(dx,dz);
    // Debaixo do aro, estender ao centro; na borda, soltar pelo lado externo.
    // Evita lançar contra a face inferior do aro durante a subida.
    if(d<.5)target={x:HOOP.x+a.hand*.015,y:1.85+(p.y??0),z:HOOP.z+.015};
    else if(d<1.1)target={x:p.x+dx/d*.14,y:1.98+(p.y??0),z:p.z+dz/d*.14};
  }
  const blend=smooth(a.elapsed/Math.min(.24,a.releaseAt));
  return {x:a.ballStart.x+(target.x-a.ballStart.x)*blend,y:a.ballStart.y+(target.y-a.ballStart.y)*blend,z:a.ballStart.z+(target.z-a.ballStart.z)*blend};
}
