import type { BallState, GameCommand, MovementInput, PlayerId, VisualPlayer } from '@x1/shared';

/** Contrato da cena: não conhece sockets, salas ou armazenamento de sessões. */
export interface GameController {
  readonly mode: 'training' | 'multiplayer';
  localPlayerId(): PlayerId | undefined;
  samplePlayer(id: PlayerId, now: number): VisualPlayer | undefined;
  sampleBall?(): BallState;
  setMovement(input: MovementInput): void;
  flushInput(): void;
  setCameraYaw(yaw: number): void;
  command(command: GameCommand): void;
  advance(seconds: number): void;
}

