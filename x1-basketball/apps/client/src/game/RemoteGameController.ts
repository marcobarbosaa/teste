import type { GameCommand, MovementInput, PlayerId, VisualPlayer } from '@x1/shared';
import type { GameConnection } from '../network/GameConnection';
import type { GameController } from './GameController';

export class RemoteGameController implements GameController {
  readonly mode = 'multiplayer' as const;
  constructor(readonly connection: GameConnection) {}
  localPlayerId() { return this.connection.getView().playerId; }
  samplePlayer(id: PlayerId, now: number): VisualPlayer | undefined {
    const position = this.connection.sample(id, now);
    return position ? { ...position, id, yaw: 0, speed: 0, gait: 0, pose: 'idle', actionTime: 0, hasBall: false, handHeight: 1 } : undefined;
  }
  setMovement(input: MovementInput) { this.connection.input = { x: input.x, z: input.z }; }
  flushInput() { this.connection.sendInput(this.connection.input); }
  setCameraYaw(_yaw: number) {}
  command(_command: GameCommand) {}
  advance(_seconds: number) {}
}

