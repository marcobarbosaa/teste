import { BALL, HOOP, SHOT } from './config';
import { angleDelta, towardHoopYaw } from './motion';
import type { Vec3, VisualPlayer } from './types';

export const shotMeter = (elapsed: number) => Math.max(0, Math.min(1, elapsed / SHOT.chargeSeconds));
export function shotVelocity(origin: Vec3, player: VisualPlayer, meter: number, attempt: number): Vec3 {
  const distance = Math.hypot(origin.x - HOOP.x, origin.z - HOOP.z);
  const timingError = meter - SHOT.ideal;
  const movementError = player.speed * .1;
  const orientationError = Math.abs(angleDelta(player.yaw, towardHoopYaw(player.x, player.z))) * .08;
  const distanceError = Math.max(0, distance - 5) * .012;
  const side = attempt % 2 ? 1 : -1;
  // Erro altera o alvo físico; nunca escolhe um resultado de cesta.
  const error = timingError * 2.4 + side * (movementError + orientationError + distanceError);
  const target = { x: HOOP.x + error, y: HOOP.y, z: HOOP.z + timingError * 1.4 };
  const apex = Math.max(origin.y, HOOP.y) + 2.4 + distance * .11;
  const vy = Math.sqrt(2 * BALL.gravity * (apex - origin.y));
  const flightTime = vy / BALL.gravity + Math.sqrt(2 * (apex - target.y) / BALL.gravity);
  return { x: (target.x - origin.x) / flightTime, y: vy, z: (target.z - origin.z) / flightTime };
}

