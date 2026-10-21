import { useState } from 'react';
import type { GameConnection, ConnectionView } from '../network/GameConnection';
export function RoomPanel({ connection, view, code, onLeave, onReconnect }: {
  connection: GameConnection; view: ConnectionView; code: string; onLeave: () => void; onReconnect: () => void;
}) {
  const [copied, setCopied] = useState('');
  const room = view.room;
  const local = room?.players.find(p => p.id === view.playerId);
  const playing = room?.phase === 'playing' && view.status === 'connected';
  async function copy() {
    const url = new URL(location.href); url.search = ''; url.searchParams.set('sala', code);
    try { await navigator.clipboard.writeText(url.toString()); setCopied('Link copiado!'); }
    catch { setCopied('Copie o endereço: ' + url.toString()); }
  }
  return <section className={'room-panel ' + (playing ? 'compact' : '')} aria-label="Sua sala">
    <div className="room-heading"><span className="eyebrow">SUA QUADRA</span><button className="text-button" onClick={onLeave}>Sair</button></div>
    <div className="invite-row"><div><span className="field-hint">CÓDIGO DA SALA</span><strong data-testid="room-code">{code}</strong></div><button className="secondary" onClick={copy}>Copiar convite</button></div>
    {copied && <p className="copy-message" role="status">{copied}</p>}
    <div className="players-list">
      {(['p1', 'p2'] as const).map((id, index) => {
        const player = room?.players.find(p => p.id === id);
        return <div className="player-row" key={id}>
          <span className={'avatar avatar-' + id}>{String(index + 1).padStart(2, '0')}</span>
          <div><strong>{player?.nickname ?? 'Aguardando um amigo'}</strong><span>{player ? id === view.playerId ? 'Você' : 'Adversário' : 'Compartilhe o convite'}</span></div>
          <span className={'player-status ' + (player?.connected && player.ready ? 'ready' : '')}>
            {!player ? 'VAGA LIVRE' : !player.connected ? 'DESCONECTADO' : player.ready ? 'PRONTO' : 'NA SALA'}
          </span>
        </div>;
      })}
    </div>
    {view.message && <p role={view.status === 'closed' ? 'alert' : 'status'} className={view.status === 'closed' ? 'error' : 'connection-message'}>{view.message}</p>}
    {!playing && view.status === 'connected' && <><button className="primary" onClick={() => connection.ready(!local?.ready)}>{local?.ready ? 'Cancelar confirmação' : 'Estou pronto'} <span aria-hidden="true">→</span></button><p className="small-note">O teste começa quando os dois estiverem prontos.</p></>}
    {view.status === 'closed' && <button className="primary" onClick={onReconnect}>Reconectar</button>}
    {playing && <p className="playing-label"><span className="live-dot"/>Movimentação liberada</p>}
  </section>;
}

