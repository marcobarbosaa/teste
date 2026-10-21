import { move, NETWORK, type PlayerId, type PlayerState, type Position, type RoomSnapshot } from '@x1/shared';

export interface Seat { player: PlayerState; token: string; expiresAt: number }
export interface SavedRoom { code: string; seats: Seat[]; expiresAt: number; tick: number }
interface Intent extends Position { seq: number; receivedAt: number }
export class RoomError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
export class Simulation {
  readonly intents = new Map<PlayerId, Intent>();
  phase: 'waiting' | 'playing' = 'waiting';
  constructor(public data: SavedRoom) {}
  join(nickname: string, token: string | undefined, now: number, newToken: () => string): Seat {
    if (now >= this.data.expiresAt) throw new RoomError('EXPIRED', 'Esta sala expirou. Crie uma nova.');
    if (token) {
      const seat = this.data.seats.find(s => s.token === token && s.expiresAt > now);
      if (!seat) throw new RoomError('SESSION', 'Sessão inválida ou expirada.');
      if (seat.player.connected) throw new RoomError('CONNECTED', 'Esta sessão já está conectada em outra aba.');
      seat.player.connected = true;
      seat.player.ready = false;
      seat.player.lastSeq = -1;
      return seat;
    }
    // Vagas não são reaproveitadas por terceiros, mesmo após desconexão.
    if (this.data.seats.length >= NETWORK.maxPlayers) throw new RoomError('FULL', 'Esta sala já tem dois jogadores.');
    const id: PlayerId = this.data.seats.length ? 'p2' : 'p1';
    const seat: Seat = {
      token: newToken(), expiresAt: this.data.expiresAt,
      player: { id, nickname, x: id === 'p1' ? -1.5 : 1.5, z: 3, connected: true, ready: false, lastSeq: -1 },
    };
    this.data.seats.push(seat);
    return seat;
  }
  ready(id: PlayerId, ready: boolean) {
    const player = this.player(id);
    if (!player) return;
    player.ready = ready;
    this.updatePhase();
  }
  disconnect(id: PlayerId) {
    const player = this.player(id);
    if (!player) return;
    player.connected = false;
    player.ready = false;
    this.intents.clear();
    for (const seat of this.data.seats) seat.player.ready = false;
    this.updatePhase();
  }
  input(id: PlayerId, intent: Intent) {
    const player = this.player(id);
    if (this.phase !== 'playing' || !player?.connected) return;
    const last = this.intents.get(id)?.seq ?? player.lastSeq;
    if (intent.seq <= last) return;
    this.intents.set(id, intent);
  }
  step(now: number) {
    if (this.phase !== 'playing') return;
    for (const { player } of this.data.seats) {
      const intent = this.intents.get(player.id);
      if (!intent) continue;
      if (now - intent.receivedAt <= NETWORK.inputTimeoutMs) Object.assign(player, move(player, intent, 1 / NETWORK.tickRate));
      player.lastSeq = intent.seq;
    }
    this.data.tick++;
  }
  player(id: PlayerId) { return this.data.seats.find(s => s.player.id === id)?.player; }
  snapshot(now: number): RoomSnapshot {
    return { code: this.data.code, tick: this.data.tick, serverTime: now, phase: this.phase, players: this.data.seats.map(s => ({ ...s.player })) };
  }
  updatePhase() {
    this.phase = this.data.seats.length === 2 && this.data.seats.every(s => s.player.connected && s.player.ready) ? 'playing' : 'waiting';
    if (this.phase === 'waiting') this.intents.clear();
  }
}

