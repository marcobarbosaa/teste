import { TRAINING, TrainingSimulation, type GameCommand, type MovementInput, type PlayerId, type VisualPlayer } from '@x1/shared';
import type { GameController } from './GameController';

export class LocalGameController implements GameController {
  readonly mode = 'training' as const;
  readonly simulation = new TrainingSimulation();
  private accumulator = 0;
  private previous: VisualPlayer = { ...this.simulation.player };
  private previousBall = { ...this.simulation.ball.position };
  private snapshot = this.simulation.view();
  private listeners = new Set<() => void>();
  private hudElapsed = 0;
  getView = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish() { this.snapshot = this.simulation.view(); this.listeners.forEach(listener => listener()); }
  readonly stepSeconds = TRAINING.stepSeconds;
  localPlayerId() { return 'p1' as const; }
  setMovement(input: MovementInput) { this.simulation.setMovement(input); }
  flushInput() {}
  setCameraYaw(yaw: number) { this.simulation.cameraYaw = yaw; }
  command(command: GameCommand) {
    this.simulation.command(command);
    if (command === 'reset') { this.accumulator = 0; this.previous = { ...this.simulation.player }; }
    if (command === 'reset' || command === 'recover') this.previousBall = { ...this.simulation.ball.position };
    this.publish();
  }
  advance(seconds: number) {
    // Passos fixos, acumulador limitado: trocar FPS não muda velocidade ou regras.
    this.accumulator += Math.max(0, Math.min(seconds, 0.1));
    while (this.accumulator + 1e-10 >= this.stepSeconds) {
      this.previous = { ...this.simulation.player };
      this.previousBall = { ...this.simulation.ball.position };
      this.simulation.step(this.stepSeconds);
      this.accumulator = Math.max(0, this.accumulator - this.stepSeconds);
    }
    this.hudElapsed += Math.min(seconds, .1);
    if (this.hudElapsed >= .05) { this.hudElapsed = 0; this.publish(); }
  }
  sampleBall() {
    const ball = this.simulation.ball, alpha = this.accumulator / this.stepSeconds;
    const p = ball.position, previous = this.previousBall;
    return { ...ball, position: { x: previous.x + (p.x - previous.x) * alpha, y: previous.y + (p.y - previous.y) * alpha, z: previous.z + (p.z - previous.z) * alpha } };
  }
  samplePlayer(id: PlayerId): VisualPlayer | undefined {
    if (id !== 'p1') return;
    const p = this.simulation.player, alpha = this.accumulator / this.stepSeconds;
    return { ...p, x: this.previous.x + (p.x - this.previous.x) * alpha, z: this.previous.z + (p.z - this.previous.z) * alpha };
  }
}

