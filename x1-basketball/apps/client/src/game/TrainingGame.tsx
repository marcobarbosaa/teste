import { lazy, Suspense, useEffect, useState } from 'react';
import { LocalGameController } from './LocalGameController';
import { useKeyboard } from '../controls/useKeyboard';
import { SceneBoundary } from '../ui/SceneBoundary';
import { TrainingHud } from '../ui/TrainingHud';
const Scene = lazy(() => import('../scene/Scene').then(module => ({ default: module.Scene })));

export function TrainingGame() {
  const [controller] = useState(() => new LocalGameController());
  useKeyboard(controller, true);
  useEffect(() => {
    if (import.meta.env.VITE_TEST_MODE !== 'true') return;
    // Leitura apenas, habilitada exclusivamente pela configuração de testes.
    const target = window as unknown as { __X1_TEST__?: { read: () => unknown } };
    target.__X1_TEST__ = { read: () => structuredClone({ player: controller.simulation.player, ball: controller.simulation.ball, time: controller.simulation.time, ...controller.simulation.view() }) };
    return () => { delete target.__X1_TEST__; };
  }, [controller]);
  return <main className="training-game" aria-label="Treino de basquete">
    <SceneBoundary><Suspense fallback={<div className="scene-fallback" role="status">Preparando a quadra…</div>}>
      <Scene controller={controller} ids="p1" active/>
    </Suspense></SceneBoundary>
    <TrainingHud controller={controller}/>
  </main>;
}

