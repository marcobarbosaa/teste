import { DurableObject } from 'cloudflare:workers';
import { NETWORK, parseClientMessage, type PlayerId, type ServerMessage } from '@x1/shared';
import { randomHex, RateLimit } from './security';
import { RoomError, Simulation, type SavedRoom } from './simulation';
import type { Env } from './index';

interface Attachment { key: string; playerId?: PlayerId; acceptedAt: number; lastSeen?: number }
export class Room extends DurableObject<Env> {
  private simulation?: Simulation;
  private timer?: ReturnType<typeof setInterval>;
  private limits = new RateLimit(NETWORK.maxMessagesPerSecond);
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const data = await ctx.storage.get<SavedRoom>('room');
      if (!data) return;
      this.simulation = new Simulation(data);
      const connected = new Set(ctx.getWebSockets().map(ws => (ws.deserializeAttachment() as Attachment).playerId));
      const wasPlaying = data.seats.length === 2 && data.seats.every(seat => seat.player.ready);
      for (const seat of data.seats) {
        seat.player.connected = connected.has(seat.player.id);
        // Hibernação da espera preserva a confirmação. Reinício ativo exige nova presença.
        if (wasPlaying || !seat.player.connected) seat.player.ready = false;
      }
      this.broadcast();
    });
  }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/health/room') return Response.json({ ok: true, storage: 'sqlite', stage: 1 });
    if (request.method === 'POST' && url.pathname === '/internal/create') {
      if (this.simulation) return Response.json({ error: 'Código indisponível.' }, { status: 409 });
      const { code, nickname } = await request.json<{ code: string; nickname: string }>();
      const now = Date.now();
      this.simulation = new Simulation({ code, seats: [], expiresAt: now + NETWORK.sessionTtlMs, tick: 0 });
      const seat = this.simulation.join(nickname, undefined, now, () => randomHex(32));
      seat.player.connected = false;
      await this.persist();
      await this.ctx.storage.setAlarm(now + NETWORK.emptyRoomTtlMs);
      return Response.json({ code, token: seat.token, expiresAt: seat.expiresAt }, { status: 201 });
    }
    if (!this.simulation || Date.now() >= this.simulation.data.expiresAt) return Response.json({ error: 'Sala não encontrada ou expirada.' }, { status: 404 });
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('Conexão WebSocket necessária.', { status: 426 });
    if (this.ctx.getWebSockets().length >= 4) return new Response('Limite de conexões.', { status: 429 });
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ key: randomHex(8), acceptedAt: Date.now() } satisfies Attachment);
    // Limpa conexões que não concluem o handshake sem manter um timer contínuo.
    const alarm = await this.ctx.storage.getAlarm();
    if (alarm === null || alarm > Date.now() + 10_000) await this.ctx.storage.setAlarm(Date.now() + 10_000);
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const attachment = ws.deserializeAttachment() as Attachment;
    const now = Date.now();
    if (!this.limits.allow(attachment.key, now)) return this.fail(ws, 'RATE', 'Muitos comandos. Conecte novamente.', 1008);
    if (typeof raw !== 'string' || new TextEncoder().encode(raw).byteLength > NETWORK.maxMessageBytes) return this.fail(ws, 'MESSAGE', 'Mensagem inválida.', 1008);
    const message = parseClientMessage(raw);
    if (!message) return this.fail(ws, 'MESSAGE', 'Mensagem inválida.', 1008);
    const sim = this.simulation;
    if (!sim || now >= sim.data.expiresAt) return this.fail(ws, 'EXPIRED', 'Esta sala expirou.', 1008);
    if (message.type === 'hello') {
      if (attachment.playerId) return this.fail(ws, 'HELLO', 'Sessão já identificada.', 1008);
      try {
        const seat = sim.join(message.nickname, message.token, now, () => randomHex(32));
        attachment.playerId = seat.player.id;
        attachment.lastSeen = now;
        ws.serializeAttachment(attachment);
        await this.persist();
        this.send(ws, { type: 'welcome', playerId: seat.player.id, token: seat.token, expiresAt: seat.expiresAt });
        this.broadcast();
      } catch (error) {
        if (error instanceof RoomError) this.fail(ws, error.code, error.message, 1008);
        else this.fail(ws, 'SERVER', 'Não foi possível entrar na sala.', 1011);
      }
      return;
    }
    if (!attachment.playerId) return this.fail(ws, 'AUTH', 'Identifique sua sessão primeiro.', 1008);
    if (message.type === 'ping') {
      attachment.lastSeen = now; ws.serializeAttachment(attachment);
      this.send(ws, { type: 'pong', time: message.time }); return;
    }
    if (message.type === 'ready') {
      sim.ready(attachment.playerId, message.ready);
      this.updateLoop();
      await this.persist();
      this.broadcast();
    } else sim.input(attachment.playerId, { ...message, receivedAt: now });
  }
  async webSocketClose(ws: WebSocket) {
    // Responder explicitamente também funciona em runtimes sem auto-reply de Close.
    ws.close(1000, 'Conexão encerrada.');
    await this.disconnected(ws);
  }
  async webSocketError(ws: WebSocket) { ws.close(1011, 'Conexão interrompida.'); await this.disconnected(ws); }
  private async disconnected(ws: WebSocket) {
    const data = ws.deserializeAttachment() as Attachment;
    this.limits.remove(data.key);
    if (data.playerId) {
      this.simulation?.disconnect(data.playerId);
      // Impede tratamento duplicado do fechamento de afetar uma reconexão posterior.
      ws.serializeAttachment({ key: data.key, acceptedAt: data.acceptedAt } satisfies Attachment);
      this.updateLoop();
      await this.persist();
      this.broadcast();
    }
    if (!this.simulation?.data.seats.some(s => s.player.connected)) await this.ctx.storage.setAlarm(Date.now() + NETWORK.emptyRoomTtlMs);
  }
  private send(ws: WebSocket, message: ServerMessage) {
    try { ws.send(JSON.stringify(message)); } catch { ws.close(1011, 'Falha de conexão.'); }
  }
  private fail(ws: WebSocket, code: string, message: string, closeCode: number) {
    this.send(ws, { type: 'error', code, message });
    ws.close(closeCode, message);
  }
  private broadcast() {
    if (!this.simulation) return;
    const message: ServerMessage = { type: 'snapshot', state: this.simulation.snapshot(Date.now()) };
    for (const ws of this.ctx.getWebSockets()) if ((ws.deserializeAttachment() as Attachment).playerId) this.send(ws, message);
  }
  private updateLoop() {
    if (this.simulation?.phase === 'playing' && !this.timer) {
      // Um passo fixo por tick; atraso não permite acumular saltos de posição.
      this.timer = setInterval(() => { this.checkPresence(Date.now()); this.simulation?.step(Date.now()); this.broadcast(); }, 1000 / NETWORK.tickRate);
    } else if (this.simulation?.phase !== 'playing' && this.timer) {
      clearInterval(this.timer); this.timer = undefined;
    }
  }
  private async persist() { if (this.simulation) await this.ctx.storage.put('room', this.simulation.data); }
  private checkPresence(now: number) {
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as Attachment;
      if (a.playerId && now - (a.lastSeen ?? a.acceptedAt) > 20_000) {
        ws.close(4000, 'Sem resposta. Reconecte sua sessão.');
        this.ctx.waitUntil(this.disconnected(ws));
      }
    }
  }
  async alarm() {
    const now = Date.now();
    this.checkPresence(now);
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as Attachment;
      if (!a.playerId && now - a.acceptedAt >= 10_000) ws.close(1008, 'Tempo de identificação esgotado.');
    }
    const sim = this.simulation;
    if (!sim || now >= sim.data.expiresAt || !sim.data.seats.some(s => s.player.connected)) {
      for (const ws of this.ctx.getWebSockets()) this.fail(ws, 'EXPIRED', 'Esta sala foi encerrada.', 1000);
      if (this.timer) clearInterval(this.timer);
      this.timer = undefined;
      this.simulation = undefined;
      await this.ctx.storage.deleteAll();
      return;
    }
    const pending = this.ctx.getWebSockets().some(ws => !(ws.deserializeAttachment() as Attachment).playerId);
    await this.ctx.storage.setAlarm(Math.min(now + (pending ? 10_000 : 30_000), sim.data.expiresAt));
  }
}

