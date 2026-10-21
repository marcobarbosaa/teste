import { lazy, Suspense } from 'react';
import { TrainingGame } from './game/TrainingGame';
const OnlineApp = lazy(() => import('./OnlineApp').then(module => ({ default: module.OnlineApp })));
export function App() {
  return import.meta.env.VITE_ENABLE_MULTIPLAYER === 'true'
    ? <Suspense fallback={<div className="scene-fallback">Abrindo modo online…</div>}><OnlineApp/></Suspense>
    : <TrainingGame/>;
}
