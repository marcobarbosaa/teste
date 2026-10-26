import type { PlayerId } from '@x1/shared';
import type { GameController } from '../game/GameController';
import { PlayerRig } from './PlayerRig';
export function Player({ id, controller }: { id: PlayerId; controller: GameController }) {
  return <PlayerRig id={id} controller={controller}/>;
}