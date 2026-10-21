import { normalizeDirection } from '../movement';
import type { MovementInput, VisualPlayer } from './types';
import { COURT, HOOP, TRAINING } from './config';
export interface Velocity2 { x: number; z: number }
export function angleDelta(from: number, to: number) { return Math.atan2(Math.sin(to - from), Math.cos(to - from)); }
export function towardHoopYaw(x: number, z: number) { return Math.atan2(x - HOOP.x, z - HOOP.z); }
export function boundPlayer(player: VisualPlayer, velocity: Velocity2) {
  const radius = TRAINING.playerRadius;
  const x = Math.max(-COURT.halfWidth + radius, Math.min(COURT.halfWidth - radius, player.x));
  const z = Math.max(COURT.minZ + radius, Math.min(COURT.maxZ - radius, player.z));
  if (x !== player.x) velocity.x = 0;
  if (z !== player.z) velocity.z = 0;
  player.x = x; player.z = z;
}
export function stepPlayer(player: VisualPlayer, velocity: Velocity2, input: MovementInput, cameraYaw: number, dt: number, charging = false) {
  const d = normalizeDirection(input);
  const speed = (input.sprint ? TRAINING.runSpeed : TRAINING.walkSpeed) * (charging ? 0.3 : 1);
  const targetX = (d.x * Math.cos(cameraYaw) + d.z * Math.sin(cameraYaw)) * speed;
  const targetZ = (-d.x * Math.sin(cameraYaw) + d.z * Math.cos(cameraYaw)) * speed;
  const moving = Math.hypot(d.x, d.z) > 0;
  const limit = (moving ? TRAINING.acceleration : TRAINING.deceleration) * dt;
  const dx = targetX - velocity.x, dz = targetZ - velocity.z, change = Math.hypot(dx, dz);
  const factor = change > limit ? limit / change : 1;
  velocity.x += dx * factor; velocity.z += dz * factor;
  player.x += velocity.x * dt; player.z += velocity.z * dt;
  boundPlayer(player, velocity);
  player.speed = Math.hypot(velocity.x, velocity.z);
  player.gait += player.speed * dt * 2.8;
  // Basquete: corpo se orienta para a cesta; lateral e recuo não fazem a câmera girar.
  const yaw = towardHoopYaw(player.x, player.z);
  player.yaw += angleDelta(player.yaw, yaw) * (1 - Math.exp(-8 * dt));
  player.pose = charging ? 'charge' : player.speed > 0.1 ? 'move' : 'idle';
}

