import { MOVEMENT } from './config';
import type { Position } from './protocol';
export function move(position: Position, input: Position, seconds: number): Position {
  const length = Math.max(1, Math.hypot(input.x, input.z));
  const distance = MOVEMENT.speed * Math.max(0, Math.min(seconds, 0.1));
  // Guard rail numérico, não é a colisão com a quadra da etapa 2.
  const clamp = (v: number) => Math.max(-MOVEMENT.maxCoordinate, Math.min(MOVEMENT.maxCoordinate, v));
  return { x: clamp(position.x + input.x / length * distance), z: clamp(position.z + input.z / length * distance) };
}

