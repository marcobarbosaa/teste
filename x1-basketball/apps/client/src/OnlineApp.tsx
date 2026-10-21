import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { GameConnection } from './network/GameConnection';
import { RemoteGameController } from './game/RemoteGameController';
import './online.css';
import { clearSession, readSession, type Session } from './network/session';
import { useKeyboard } from './controls/useKeyboard';
import { Lobby } from './ui/Lobby';
import { RoomPanel } from './ui/RoomPanel';
import { SceneBoundary } from './ui/SceneBoundary';
const Scene = lazy(() => import('./scene/Scene').then(module => ({ default: module.Scene })));
export function OnlineApp() {
  const [connection] = useState(() => new GameConnection());
  const [controller] = useState(() => new RemoteGameController(connection));
  const [session, setSession] = useState<Session | null>(null);
  const view = useSyncExternalStore(connection.subscribe, connection.getView);
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = readSession();
      const invitation = new URLSearchParams(location.search).get('sala')?.toUpperCase();
      if (saved && (!invitation || invitation === saved.code)) { setSession(saved); connection.connect(saved); }
    }, 0);
    return () => { clearTimeout(timer); connection.close(); };
  }, [connection]);
  const playing = view.status === 'connected' && view.room?.phase === 'playing';
  useKeyboard(controller, playing);
  const join = (next: Session) => { setSession(next); connection.connect(next); };
  const leave = () => { connection.close(); clearSession(); setSession(null); connection.latest = undefined; connection.frames = []; history.replaceState(null, '', location.pathname); };
  return <main className={session ? 'app in-room' : 'app'}>
    <header className="topbar"><a className="brand" href="./" aria-label="X1 Basketball, início"><span className="brand-icon" aria-hidden="true">✕</span> X1<span className="brand-light"> BASKETBALL</span></a><span className="build-badge">PRIMEIRO PROTÓTIPO <span>01</span></span></header>
    <div className="stage"><SceneBoundary><Suspense fallback={<div className="scene-fallback">Preparando a quadra…</div>}><Scene controller={controller} ids={session ? view.room?.players.map(p => p.id).join(',') ?? '' : ''} active={playing}/></Suspense></SceneBoundary></div>
    <div className="scene-caption"><span className="live-dot"/>{session ? playing ? 'VOCÊ ESTÁ NA QUADRA' : 'QUADRA RESERVADA' : 'O PRÓXIMO X1 COMEÇA AQUI'}</div>
    {session ? <RoomPanel connection={connection} view={view} code={session.code} onLeave={leave} onReconnect={() => connection.connect(readSession() ?? session)}/> : <Lobby onJoin={join}/>}
    {session && <div className="controls-card"><span className="eyebrow">CONTROLE A QUADRA</span><div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>Movimentar</span></div><p>Câmera automática · Sem mouse</p></div>}
    <footer><span>MEIA QUADRA. ENCONTRO MARCADO.</span><span className="connection-pill"><span className={'status-dot ' + (view.status === 'connected' ? 'online' : '')}/>{view.status === 'connected' ? 'Conectado' + (view.latency ? ' · ' + view.latency + ' ms' : '') : session ? 'Conectando à sala' : 'Feito para jogar junto'}</span></footer>
  </main>;
}

