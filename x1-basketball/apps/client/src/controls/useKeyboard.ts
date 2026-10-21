import { useEffect } from 'react';
import { CONTROLS, NETWORK } from '@x1/shared';
import type { GameConnection } from '../network/GameConnection';

export function useKeyboard(connection: GameConnection, enabled: boolean) {
  useEffect(() => {
    if (!enabled) { connection.sendInput({ x: 0, z: 0 }); return; }
    const held = new Set<string>();
    const movementKeys: string[] = [CONTROLS.forward, CONTROLS.backward, CONTROLS.left, CONTROLS.right];
    const direction = () => ({
      x: Number(held.has(CONTROLS.right)) - Number(held.has(CONTROLS.left)),
      z: Number(held.has(CONTROLS.backward)) - Number(held.has(CONTROLS.forward)),
    });
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input,textarea,[contenteditable="true"]')) return;
      if (!movementKeys.includes(event.code)) return;
      event.preventDefault();
      if (event.type === 'keydown') held.add(event.code); else held.delete(event.code);
      connection.input = direction(); // feedback imediato; transmissão permanece limitada a 20 Hz.
    };
    const release = () => { held.clear(); connection.sendInput({ x: 0, z: 0 }); };
    const visibility = () => { if (document.hidden) release(); };
    const interval = setInterval(() => connection.sendInput(direction()), 1000 / NETWORK.tickRate);
    addEventListener('keydown', key); addEventListener('keyup', key); addEventListener('blur', release);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearInterval(interval); removeEventListener('keydown', key); removeEventListener('keyup', key); removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', visibility); release();
    };
  }, [connection, enabled]);
}

