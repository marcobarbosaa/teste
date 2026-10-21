import { MOVEMENT, NETWORK, parseServerMessage, type ClientMessage, type PlayerId, type Position, type RoomSnapshot } from '@x1/shared';
import { saveSession, type Session } from './session';

export interface ConnectionView {
  status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed';
  message: string; playerId?: PlayerId; room?: RoomSnapshot; latency: number;
}
export class GameConnection {
  private ws?: WebSocket;
  private listeners = new Set<() => void>();
  private view: ConnectionView = { status: 'idle', message: '', latency: 0 };
  private session?: Session;
  private retry?: ReturnType<typeof setTimeout>;
  private heartbeat?: ReturnType<typeof setInterval>;
  private handshake?: ReturnType<typeof setTimeout>;
  private stopped = false;
  private attempts = 0;
  private receivedAt = 0;
  private seq = 0;
  private lastSignature = '';
  private lastPongAt = 0;
  frames: { state: RoomSnapshot; at: number }[] = [];
  input: Position = { x: 0, z: 0 };
  latest?: RoomSnapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getView = () => this.view;
  private update(patch: Partial<ConnectionView>) { this.view = { ...this.view, ...patch }; for (const listener of this.listeners) listener(); }
  connect(session: Session) {
    this.close();
    this.stopped = false; this.attempts = 0; this.session = session;
    this.view = { status: 'connecting', message: '', latency: 0 };
    this.frames = []; this.latest = undefined; this.lastSignature = '';
    this.open();
  }
  private open() {
    if (!this.session || this.stopped) return;
    const url = new URL('/api/rooms/' + this.session.code + '/socket', location.href);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(url);
    this.ws = ws; this.seq = 0;
    this.update({ status: this.attempts ? 'reconnecting' : 'connecting', message: this.attempts ? 'Tentando recuperar sua conexão…' : 'Entrando na quadra…' });
    this.handshake = setTimeout(() => { if (ws === this.ws) ws.close(); }, 8000);
    ws.onopen = () => {
      this.send({ type: 'hello', version: NETWORK.protocol, nickname: this.session!.nickname, ...(this.session!.token ? { token: this.session!.token } : {}) });
    };
    ws.onmessage = event => {
      if (ws !== this.ws || typeof event.data !== 'string') return;
      const message = parseServerMessage(event.data);
      if (!message) { this.stopped = true; this.update({ status: 'closed', message: 'Resposta incompatível do servidor.' }); ws.close(); return; }
      if (message.type === 'welcome') {
        clearTimeout(this.handshake); this.attempts = 0;
        this.session = { ...this.session!, token: message.token, expiresAt: message.expiresAt };
        saveSession(this.session);
        this.update({ status: 'connected', playerId: message.playerId, message: '' });
        this.lastPongAt = Date.now();
        this.heartbeat = setInterval(() => {
          if (Date.now() - this.lastPongAt > 15_000) { ws.close(); return; }
          this.send({ type: 'ping', time: Date.now() });
        }, 5000);
      } else if (message.type === 'snapshot') {
        this.latest = message.state; this.receivedAt = performance.now();
        this.frames.push({ state: message.state, at: this.receivedAt });
        if (this.frames.length > 8) this.frames.shift();
        const signature = JSON.stringify([message.state.phase, message.state.players.map(p => [p.id, p.nickname, p.connected, p.ready])]);
        if (signature !== this.lastSignature) { this.lastSignature = signature; this.update({ room: message.state }); }
      } else if (message.type === 'pong') {
        this.lastPongAt = Date.now(); this.update({ latency: Math.max(0, Date.now() - message.time) });
      } else {
        this.stopped = true; this.update({ message: message.message, status: 'closed' }); ws.close();
      }
    };
    ws.onclose = () => {
      if (ws !== this.ws) return;
      clearTimeout(this.handshake); clearInterval(this.heartbeat);
      this.input = { x: 0, z: 0 };
      if (this.stopped) return;
      if (++this.attempts > 5) { this.update({ status: 'closed', message: 'Sem conexão. Tente reconectar ou crie outra sala.' }); return; }
      this.update({ status: 'reconnecting', message: 'Conexão interrompida. Sua vaga está reservada.' });
      this.retry = setTimeout(() => this.open(), Math.min(500 * 2 ** this.attempts, 5000));
    };
    ws.onerror = () => { /* onclose centraliza o fluxo e evita reconexões duplicadas. */ };
  }
  ready(ready: boolean) { this.send({ type: 'ready', ready }); }
  sendInput(input: Position) {
    this.input = input;
    if (this.latest?.phase === 'playing' && this.view.status === 'connected') this.send({ type: 'input', seq: this.seq++, ...input });
  }
  private send(message: ClientMessage) { if (this.ws?.readyState === WebSocket.OPEN && this.ws.bufferedAmount < 8192) this.ws.send(JSON.stringify(message)); }
  sample(id: PlayerId, now: number): Position | undefined {
    const current = this.latest?.players.find(p => p.id === id);
    if (!current) return;
    if (id === this.view.playerId) {
      const length = Math.max(1, Math.hypot(this.input.x, this.input.z));
      const age = this.latest?.phase === 'playing' && this.view.status === 'connected' ? Math.min((now - this.receivedAt) / 1000, 0.1) : 0;
      return { x: current.x + this.input.x / length * MOVEMENT.speed * age, z: current.z + this.input.z / length * MOVEMENT.speed * age };
    }
    const time = now - 100;
    const right = this.frames.findIndex(f => f.at >= time);
    const a = this.frames[Math.max(0, right - 1)];
    const b = this.frames[right] ?? this.frames.at(-1);
    if (!a || !b) return current;
    const pa = a.state.players.find(p => p.id === id), pb = b.state.players.find(p => p.id === id);
    if (!pa || !pb) return current;
    const t = a.at === b.at ? 1 : Math.max(0, Math.min(1, (time - a.at) / (b.at - a.at)));
    return { x: pa.x + (pb.x - pa.x) * t, z: pa.z + (pb.z - pa.z) * t };
  }
  close() {
    this.stopped = true;
    clearTimeout(this.retry); clearTimeout(this.handshake); clearInterval(this.heartbeat);
    const ws = this.ws; this.ws = undefined;
    ws?.close(); this.input = { x: 0, z: 0 };
    this.update({ status: 'idle' });
  }
}

