import { BALL, TRAINING } from './config';
import type { BallState, VisualPlayer } from './types';
export function createBall(): BallState {
  return { position: { x: .46, y: 1.04, z: 1.28 }, velocity: {x:0,y:0,z:0}, mode: 'held', spin: 0, shotId: 0, scored: false, gateEntered: false, lastContact: 'none', contactSerial: 0 };
}
export function possessionBall(ball: BallState, player: VisualPlayer, phase: number, charging: boolean, dt: number = TRAINING.stepSeconds, snap = false) {
  const forward = { x: -Math.sin(player.yaw), z: -Math.cos(player.yaw) };
  const right = { x: Math.cos(player.yaw), z: -Math.sin(player.yaw) };
  const dribbling = !charging && player.speed > .12;
  const blend = !snap && !dribbling ? 1 - Math.exp(-22 * dt) : 1;
  ball.mode = dribbling ? 'dribbling' : 'held';
  const side = charging ? .06 : .46, front = charging ? .34 : .22;
  const target = {
    x: player.x + right.x * side + forward.x * front,
    y: charging ? 1.94 : dribbling ? BALL.floorY + BALL.radius + .88 * Math.abs(Math.sin(phase)) : 1.04,
    z: player.z + right.z * side + forward.z * front,
  };
  ball.position.x += (target.x - ball.position.x) * blend;
  ball.position.y += (target.y - ball.position.y) * blend;
  ball.position.z += (target.z - ball.position.z) * blend;
  ball.velocity = { x: 0, y: 0, z: 0 };
  player.handHeight = Math.max(.85, ball.position.y + BALL.radius);
  if (dribbling) ball.spin += player.speed * dt * 2.4;
}

