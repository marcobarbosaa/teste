import { useState, type FormEvent } from 'react';
import { NETWORK, validNickname } from '@x1/shared';
import { saveSession, type Session } from '../network/session';

export function Lobby({ onJoin }: { onJoin: (session: Session) => void }) {
  const invited = new URLSearchParams(location.search).get('sala')?.toUpperCase() ?? '';
  const [mode, setMode] = useState<'create' | 'join'>(invited ? 'join' : 'create');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState(invited);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    const name = nickname.trim();
    if (!validNickname(name)) { setError('Use um apelido de 2 a 18 caracteres, sem símbolos < ou >.'); return; }
    if (mode === 'join' && !NETWORK.roomCodePattern.test(code.trim().toUpperCase())) { setError('O código tem 12 letras de A a F e números.'); return; }
    setBusy(true);
    try {
      let session: Session = { code: code.trim().toUpperCase(), nickname: name };
      if (mode === 'create') {
        const response = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: name }), signal: AbortSignal.timeout(10_000) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível criar a sala.');
        if (!NETWORK.roomCodePattern.test(data.code) || typeof data.token !== 'string') throw new Error('Resposta inválida do servidor.');
        session = { ...session, ...data };
      }
      saveSession(session); onJoin(session);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Servidor indisponível. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <section className="lobby">
    <span className="eyebrow">BASQUETE DE RUA · ENTRE AMIGOS</span>
    <h1>X1 <span>Basketball</span><span className="title-dot">.</span></h1>
    <p className="intro">Seu amigo do outro lado.<br/>Você no controle da quadra.</p>
    <div className="tabs" aria-label="Modo de entrada">
      <button type="button" aria-pressed={mode === 'create'} onClick={() => { setMode('create'); setError(''); }}>Criar sala</button>
      <button type="button" aria-pressed={mode === 'join'} onClick={() => { setMode('join'); setError(''); }}>Entrar com código</button>
    </div>
    <form onSubmit={submit}>
      <label htmlFor="nickname">Como você joga por aqui?</label>
      <input id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Seu apelido" minLength={2} maxLength={18} required autoComplete="nickname"/>
      {mode === 'join' && <><label htmlFor="code">Código da sala</label><input id="code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex.: A8F2C901D3B7" maxLength={12} required autoComplete="off" spellCheck={false}/></>}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={busy} type="submit">{busy ? 'Preparando…' : mode === 'create' ? 'Criar minha quadra' : 'Entrar na quadra'} <span aria-hidden="true">↗</span></button>
    </form>
    <p className="small-note">Uma sala privada. Duas pessoas. Sem cadastro.</p>
    <div className="scope-note"><span className="scope-tag">PROTÓTIPO 01</span><p>Teste a conexão e a movimentação com um amigo. Bola, cestas e partidas chegam nas próximas etapas.</p></div>
  </section>;
}

