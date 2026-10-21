import { BALL, TRAINING } from './config';
import { stepPlayer } from './motion';
import { createBall, possessionBall } from './possession';
import { shotMeter, shotVelocity } from './shooting';
import { stepBall } from './ballPhysics';
import type { GameCommand, MovementInput, TrainingView, VisualPlayer } from './types';

export class TrainingSimulation {
  time = 0;
  player: VisualPlayer = this.createPlayer();
  ball = createBall();
  attempts = 0;
  makes = 0;
  charging = false;
  private chargeStart = 0;
  private releasedAt = -100;
  private dribblePhase = Math.PI / 2;
  private feedback = 'Sua quadra. Seu ritmo.';
  private feedbackUntil = 5;
  private missReported = false;
  private input: MovementInput = { x: 0, z: 0, sprint: false };
  cameraYaw = 0;
  velocity = { x: 0, z: 0 };
  private createPlayer(): VisualPlayer {
    return { id: 'p1', x: TRAINING.spawnX, z: TRAINING.spawnZ, yaw: 0, speed: 0, gait: 0, pose: 'idle', actionTime: 0, hasBall: true, handHeight: 1.16 };
  }
  setMovement(input: MovementInput) { this.input = input; }
  view(): TrainingView {
    return { attempts: this.attempts, makes: this.makes, charging: this.charging, meter: this.charging ? shotMeter(this.time - this.chargeStart) : 0, feedback: this.time < this.feedbackUntil ? this.feedback : '', ballMode: this.ball.mode };
  }
  private notify(message: string) { this.feedback = message; this.feedbackUntil = this.time + 3; }
  private recover() {
    this.charging = false;
    this.player.hasBall = true;
    this.ball.gateEntered = false;
    this.ball.shotId = 0;
    this.releasedAt = -100;
    possessionBall(this.ball, this.player, this.dribblePhase, false, TRAINING.stepSeconds, true);
  }
  command(command: GameCommand) {
    if (command === 'reset') {
      this.time = 0; this.player = this.createPlayer(); this.ball = createBall();
      this.velocity = { x: 0, z: 0 }; this.input = { x: 0, z: 0, sprint: false };
      this.attempts = 0; this.makes = 0; this.charging = false;
      this.dribblePhase = Math.PI / 2; this.releasedAt = -100; this.notify('Novo treino');
    } else if (command === 'recover') {
      this.recover(); this.notify('Bola recuperada');
    } else if (command === 'cancel') {
      this.charging = false;
    } else if (command === 'charge' && this.player.hasBall && !this.charging) {
      this.charging = true; this.chargeStart = this.time;
    } else if (command === 'release' && this.charging && this.player.hasBall) {
      const meter = shotMeter(this.time - this.chargeStart);
      this.attempts++;
      this.ball.velocity = shotVelocity(this.ball.position, this.player, meter, this.attempts);
      this.ball.mode = 'flight'; this.ball.shotId = this.attempts;
      this.ball.scored = false; this.ball.gateEntered = false; this.ball.lastContact = 'none';
      this.charging = false; this.player.hasBall = false;
      this.releasedAt = this.time; this.missReported = false;
      this.notify(meter < .65 ? 'Soltou cedo' : meter > .79 ? 'Soltou tarde' : 'Boa soltura');
    }
  }
  step(dt: number) {
    this.time += dt;
    stepPlayer(this.player, this.velocity, this.input, this.cameraYaw, dt, this.charging);
    this.player.actionTime = this.time - this.releasedAt;
    if (this.player.actionTime < .65) this.player.pose = 'release';
    if (this.player.hasBall) {
      if (this.player.speed > .12 && !this.charging) this.dribblePhase += dt * (8 + this.player.speed * 1.6);
      else this.dribblePhase = Math.PI / 2;
      possessionBall(this.ball, this.player, this.dribblePhase, this.charging, dt);
    } else {
      if (stepBall(this.ball, dt)) { this.makes++; this.notify('Cesta!'); }
      if (this.ball.mode === 'loose' && !this.ball.scored && !this.missReported) {
        this.missReported = true; this.notify('Tente outra vez');
      }
      const p = this.ball.position;
      const nearby = this.ball.mode === 'loose' && p.y < 1.35 && Math.hypot(p.x - this.player.x, p.z - this.player.z) < BALL.pickupRadius && this.player.actionTime > .8;
      if (nearby) this.recover();
      else if (this.player.actionTime > BALL.returnSeconds || Math.hypot(p.x, p.z) > 25 || !Number.isFinite(p.y)) {
        this.recover(); this.notify('Bola devolvida ao treino');
      }
    }
  }
}

