import { BALL, CONTACT } from './config';
import { collideBall, respond } from './collisions';
import { sweepBoard } from './boardCollision';
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
    let remaining=h;
    for(let impact=0;impact<4 && remaining>1e-8;impact++) {
      const v=ball.velocity, p=ball.position;
      const next={x:p.x+v.x*remaining,y:p.y+v.y*remaining-.5*BALL.gravity*remaining*remaining,z:p.z+v.z*remaining};
      const hit=sweepBoard(p,next);
      const elapsed=hit ? remaining*hit.t : remaining;
      ball.velocity.y-=BALL.gravity*elapsed;
      ball.position=hit ? hit.position : next;
      remaining-=elapsed;
      if(hit) respond(ball,hit.normal,0,CONTACT.boardRestitution,'board');
      else break;
    }
    collideBall(ball);
    if (detectBasket(previous, ball)) made = true;
    const drag = Math.exp(-(ball.mode === 'loose' && ball.position.y < BALL.radius + BALL.floorY + .04 ? 1.8 : 0) * h);
    ball.velocity.x *= drag; ball.velocity.z *= drag;
    ball.spin += Math.hypot(ball.velocity.x, ball.velocity.y, ball.velocity.z) * h * 1.5;
  }
  return made;
}

