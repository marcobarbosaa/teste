import { BALL, HOOP } from './config';
import type { Vec3 } from './types';

export function boardDistance(p: Vec3) {
  const closest = { x: Math.max(HOOP.x-HOOP.boardWidth/2, Math.min(HOOP.x+HOOP.boardWidth/2,p.x)), y: Math.max(HOOP.boardY-HOOP.boardHeight/2,Math.min(HOOP.boardY+HOOP.boardHeight/2,p.y)), z: Math.max(HOOP.boardZ-HOOP.boardDepth/2,Math.min(HOOP.boardZ+HOOP.boardDepth/2,p.z)) };
  const delta = {x:p.x-closest.x,y:p.y-closest.y,z:p.z-closest.z};
  const distance = Math.hypot(delta.x,delta.y,delta.z);
  if (distance > 1e-10) return { distance, normal: {x:delta.x/distance,y:delta.y/distance,z:delta.z/distance} };
  const faces = [
    {distance:HOOP.boardWidth/2-Math.abs(p.x-HOOP.x),normal:{x:p.x>=HOOP.x?1:-1,y:0,z:0}},
    {distance:HOOP.boardHeight/2-Math.abs(p.y-HOOP.boardY),normal:{x:0,y:p.y>=HOOP.boardY?1:-1,z:0}},
    {distance:HOOP.boardDepth/2-Math.abs(p.z-HOOP.boardZ),normal:{x:0,y:0,z:p.z>=HOOP.boardZ?1:-1}},
  ].sort((a,b)=>a.distance-b.distance);
  return { distance:-faces[0].distance, normal:faces[0].normal };
}
export function outsideBoard(p: Vec3): Vec3 {
  const hit=boardDistance(p), depth=BALL.radius-hit.distance;
  return depth>0 ? {x:p.x+hit.normal.x*(depth+.00001),y:p.y+hit.normal.y*(depth+.00001),z:p.z+hit.normal.z*(depth+.00001)} : {...p};
}
/** Avanço conservador sobre a distância exata esfera/caixa, inclusive cantos arredondados. */
export function sweepBoard(from: Vec3, to: Vec3) {
  const d={x:to.x-from.x,y:to.y-from.y,z:to.z-from.z}, length=Math.hypot(d.x,d.y,d.z);
  if(length<1e-10) return null;
  let t=0;
  for(let i=0;i<96 && t<=1;i++) {
    const position={x:from.x+d.x*t,y:from.y+d.y*t,z:from.z+d.z*t};
    const contact=boardDistance(position), gap=contact.distance-BALL.radius;
    if(gap<.000001) {
      const approaching=d.x*contact.normal.x+d.y*contact.normal.y+d.z*contact.normal.z<0;
      return approaching || gap<-.000001 ? {t,position:outsideBoard(position),normal:contact.normal} : null;
    }
    t+=Math.max(gap/length,1e-9);
  }
  return null;
}
