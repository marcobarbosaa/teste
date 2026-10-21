import { BALL, HOOP } from './config';
import type { BallContact, BallState, Vec3 } from './types';

function respond(ball: BallState, normal: Vec3, penetration: number, restitution: number, contact: BallContact) {
  ball.position.x += normal.x * (penetration + .0001);
  ball.position.y += normal.y * (penetration + .0001);
  ball.position.z += normal.z * (penetration + .0001);
  const dot = ball.velocity.x * normal.x + ball.velocity.y * normal.y + ball.velocity.z * normal.z;
  if (dot < 0) {
    ball.velocity.x -= (1 + restitution) * dot * normal.x;
    ball.velocity.y -= (1 + restitution) * dot * normal.y;
    ball.velocity.z -= (1 + restitution) * dot * normal.z;
    if (dot < -.2) { ball.lastContact = contact; ball.contactSerial++; }
  }
  if (contact === 'rim') ball.gateEntered = false;
}
function box(ball: BallState, center: Vec3, half: Vec3, contact: BallContact) {
  const p = ball.position;
  const closest = { x: Math.max(center.x - half.x, Math.min(center.x + half.x, p.x)), y: Math.max(center.y - half.y, Math.min(center.y + half.y, p.y)), z: Math.max(center.z - half.z, Math.min(center.z + half.z, p.z)) };
  const delta = { x: p.x - closest.x, y: p.y - closest.y, z: p.z - closest.z };
  const d = Math.hypot(delta.x, delta.y, delta.z);
  if (d >= BALL.radius) return;
  if (d > .000001) respond(ball, { x: delta.x / d, y: delta.y / d, z: delta.z / d }, BALL.radius - d, .7, contact);
  else {
    const faces = [
      { distance: half.x - Math.abs(p.x - center.x), normal: { x: p.x >= center.x ? 1 : -1, y: 0, z: 0 } },
      { distance: half.y - Math.abs(p.y - center.y), normal: { x: 0, y: p.y >= center.y ? 1 : -1, z: 0 } },
      { distance: half.z - Math.abs(p.z - center.z), normal: { x: 0, y: 0, z: p.z >= center.z ? 1 : -1 } },
    ].sort((a,b) => a.distance - b.distance);
    respond(ball, faces[0].normal, BALL.radius + faces[0].distance, .7, contact);
  }
}
export function collideBall(ball: BallState) {
  const p = ball.position;
  box(ball, { x: HOOP.x, y: HOOP.boardY, z: HOOP.boardZ }, { x: HOOP.boardWidth / 2, y: HOOP.boardHeight / 2, z: HOOP.boardDepth / 2 }, 'board');
  const radial = Math.hypot(p.x - HOOP.x, p.z - HOOP.z);
  if (radial > 1e-8) {
    const closest = { x: HOOP.x + (p.x - HOOP.x) / radial * HOOP.radius, y: HOOP.y, z: HOOP.z + (p.z - HOOP.z) / radial * HOOP.radius };
    const dx = p.x - closest.x, dy = p.y - closest.y, dz = p.z - closest.z;
    const d = Math.hypot(dx, dy, dz), radius = BALL.radius + HOOP.tube;
    if (d < radius && d > 1e-8) respond(ball, { x: dx/d, y: dy/d, z: dz/d }, radius-d, .66, 'rim');
  }
  const postDistance = Math.hypot(p.x, p.z - HOOP.postZ);
  if (p.y < 3.5 && postDistance > 1e-8 && postDistance < HOOP.postRadius + BALL.radius)
    respond(ball, { x: p.x/postDistance, y:0, z:(p.z-HOOP.postZ)/postDistance }, HOOP.postRadius + BALL.radius-postDistance, .6, 'post');
  if (p.y < 2.7) {
    if (p.x > 9 - BALL.radius) respond(ball, {x:-1,y:0,z:0}, p.x - 9 + BALL.radius, .5, 'fence');
    if (p.x < -9 + BALL.radius) respond(ball, {x:1,y:0,z:0}, -9 + BALL.radius - p.x, .5, 'fence');
    if (p.z < -8.6 + BALL.radius) respond(ball, {x:0,y:0,z:1}, -8.6 + BALL.radius - p.z, .5, 'fence');
  }
  if (p.y < BALL.radius + BALL.floorY) {
    const impact = -ball.velocity.y;
    respond(ball, {x:0,y:1,z:0}, BALL.radius + BALL.floorY - p.y, impact < .65 ? 0 : BALL.bounce, 'floor');
    ball.mode = 'loose';
    if (impact > .65) { ball.velocity.x *= .82; ball.velocity.z *= .82; }
  }
}

