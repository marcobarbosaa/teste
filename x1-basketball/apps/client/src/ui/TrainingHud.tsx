import { useEffect, useState, useSyncExternalStore } from 'react';
import { SHOT } from '@x1/shared';
import type { LocalGameController } from '../game/LocalGameController';

export function TrainingHud({ controller }: { controller: LocalGameController }) {
  const view = useSyncExternalStore(controller.subscribe, controller.getView);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [fullscreenError, setFullscreenError] = useState('');
  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setFullscreenError('');
    } catch { setFullscreenError('Tela cheia indisponível neste navegador.'); }
  }
  return <>
    <div className="training-score" aria-label="Estatísticas do treino">
      <div className="training-brand">X1<span>BASKETBALL</span></div>
      <div className="stat"><strong data-testid="makes">{view.makes}</strong><span>Cestas</span></div>
      <div className="stat"><strong data-testid="attempts">{view.attempts}</strong><span>Tentativas</span></div>
      <div className="stat"><strong data-testid="percentage">{view.attempts ? Math.round(view.makes / view.attempts * 100) : 0}%</strong><span>Aproveitamento</span></div>
    </div>
    <div className="training-actions">
      <div className="training-mode"><span className="live-dot"/>Modo treino</div>
      <button disabled={!document.fullscreenEnabled} onClick={event => { event.currentTarget.blur(); void toggleFullscreen(); }}>{fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</button>
      <button onClick={event => { event.currentTarget.blur(); controller.command('reset'); }}>Reiniciar treino</button>
    </div>
    <div className="training-feedback" role="status">{fullscreenError || view.feedback}</div>
    {view.charging && <div className="shot-meter-wrap">
      <div className="shot-meter-label">SOLTE NO VERDE<span>Arremesso</span></div>
      <div className="shot-meter" role="meter" aria-label="Força do arremesso" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(view.meter * 100)}>
        <div className="shot-green" style={{ left: (SHOT.ideal - SHOT.greenHalfWidth) * 100 + '%', width: SHOT.greenHalfWidth * 200 + '%' }}/>
        <div className="shot-progress" style={{ width: view.meter * 100 + '%' }}/>
        <div className="shot-cursor" style={{ left: view.meter * 100 + '%' }}/>
      </div>
    </div>}
    <div className="training-help">
      <span><kbd>W A S D</kbd> Mover</span><span><kbd>Shift</kbd> Correr</span>
      <span><kbd>Espaço</kbd> Segurar / soltar</span><span><kbd>E</kbd> Finalizar</span><span><kbd>F</kbd> Finta</span><span><kbd>R</kbd> Recuperar</span>
    </div>
  </>;
}
