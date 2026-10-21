import { describe, expect, it } from 'vitest';
import { LocalGameController } from '../../apps/client/src/game/LocalGameController';
import { TRAINING } from '@x1/shared';
describe('controlador local real', () => {
  it('tem uma vaga sem rede e é independente da taxa de renderização', () => {
    const run = (fps: number) => {
      const controller = new LocalGameController();
      controller.setMovement({ x: 0, z: -1, sprint: false });
      for (let i = 0; i < fps; i++) controller.advance(1 / fps);
      return controller;
    };
    const a=run(30), b=run(144);
    expect(a.simulation.player.z).toBeCloseTo(b.simulation.player.z, 8);
    expect(a.localPlayerId()).toBe('p1'); expect(a.samplePlayer('p2')).toBeUndefined();
    a.command('reset'); expect(a.simulation.player.z).toBe(TRAINING.spawnZ);
  });
});

