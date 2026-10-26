import { useEffect } from 'react';
import { CONTROLS, NETWORK } from '@x1/shared';
import type { GameController } from '../game/GameController';

export function useKeyboard(controller: GameController, enabled: boolean) {
  useEffect(() => {
    const zero = { x: 0, z: 0, sprint: false };
    if (!enabled) { controller.setMovement(zero); controller.flushInput(); return; }
    const held = new Set<string>();
    const movement: string[] = [CONTROLS.forward, CONTROLS.backward, CONTROLS.left, CONTROLS.right, CONTROLS.sprint, 'ShiftRight'];
    const update = () => controller.setMovement({
      x: Number(held.has(CONTROLS.right)) - Number(held.has(CONTROLS.left)),
      z: Number(held.has(CONTROLS.backward)) - Number(held.has(CONTROLS.forward)),
      sprint: held.has(CONTROLS.sprint) || held.has('ShiftRight'),
    });
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input,textarea,[contenteditable="true"]')) return;
      if (movement.includes(event.code)) {
        event.preventDefault();
        if (event.type === 'keydown') held.add(event.code); else held.delete(event.code);
        update();
      } else if (controller.mode === 'training' && event.code === CONTROLS.shotOrBlock) {
        if (target?.closest('button')) return;
        event.preventDefault();
        if (!event.repeat) controller.command(event.type === 'keydown' ? 'charge' : 'release');
      } else if (controller.mode === 'training' && event.code === CONTROLS.recover && event.type === 'keydown' && !event.repeat) {
        event.preventDefault(); controller.command('recover');
      } else if(controller.mode==='training' && (event.code===CONTROLS.finish || event.code===CONTROLS.fake) && event.type==='keydown' && !event.repeat){
        event.preventDefault();controller.command(event.code===CONTROLS.finish?'finish':'fake');
      }
    };
    const release = () => { held.clear(); controller.setMovement(zero); controller.command('cancel'); controller.flushInput(); };
    const visibility = () => { if (document.hidden) release(); };
    const interval = setInterval(() => controller.flushInput(), 1000 / NETWORK.tickRate);
    addEventListener('keydown', key); addEventListener('keyup', key); addEventListener('blur', release);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearInterval(interval); removeEventListener('keydown', key); removeEventListener('keyup', key); removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', visibility); release();
    };
  }, [controller, enabled]);
}
