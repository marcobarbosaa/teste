import { BALL, HOOP } from './config';
import type { BallState, Vec3 } from './types';

function crossing(previous: Vec3, next: Vec3, height: number): Vec3 | null {
  if (previous.y <= height || next.y > height || next.y >= previous.y) return null;
  const t = (previous.y - height) / (previous.y - next.y);
  return { x: previous.x + (next.x - previous.x) * t, y: height, z: previous.z + (next.z - previous.z) * t };
}
/** Exige entrada por cima e saída por baixo, com a esfera cabendo no interior do aro. */
export function detectBasket(previous: Vec3, ball: BallState): boolean {
  if (!ball.shotId || ball.scored) return false;
  if (ball.velocity.y >= 0) { ball.gateEntered = false; return false; }
  const clearance = HOOP.radius - HOOP.tube - BALL.radius;
  const fits = (p: Vec3) => Math.hypot(p.x - HOOP.x, p.z - HOOP.z) < clearance;
  const entry = crossing(previous, ball.position, HOOP.y + BALL.radius);
  if (entry) ball.gateEntered = fits(entry);
  const exit = crossing(previous, ball.position, HOOP.y - BALL.radius);
  if (!exit) return false;
  const made = ball.gateEntered && fits(exit);
  ball.gateEntered = false;
  if (made) ball.scored = true;
  return made;
}

