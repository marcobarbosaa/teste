import { BALL } from './config';
import { collideBall } from './collisions';
import { detectBasket } from './scoring';
import type { BallState } from './types';

export function stepBall(ball: BallState, dt: number): boolean {
  if (ball.mode !== 'flight' && ball.mode !== 'loose') return false;
  // Deslocamento por subpasso menor que 35% do raio evita atravessar aro/tabela.
  const speed = Math.hypot(ball.velocity.x, ball.velocity.y, ball.velocity.z);
  const steps = Math.max(2, Math.min(16, Math.ceil(speed * dt / (BALL.radius * .35))));
  const h = dt / steps;
  let made = false;
  for (let i=0;i<steps;i++) {
    const previous = { ...ball.position };
    ball.position.x += ball.velocity.x * h;
    ball.position.y += ball.velocity.y * h - .5 * BALL.gravity * h * h;
    ball.position.z += ball.velocity.z * h;
    ball.velocity.y -= BALL.gravity * h;
    collideBall(ball);
    if (detectBasket(previous, ball)) made = true;
    const drag = Math.exp(-(ball.mode === 'loose' && ball.position.y < BALL.radius + BALL.floorY + .04 ? 1.8 : 0) * h);
    ball.velocity.x *= drag; ball.velocity.z *= drag;
    ball.spin += Math.hypot(ball.velocity.x, ball.velocity.y, ball.velocity.z) * h * 1.5;
  }
  return made;
}

