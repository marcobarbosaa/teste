import { NETWORK } from './config';
import type { ClientMessage, RoomSnapshot, ServerMessage } from './protocol';
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).every(k => keys.includes(k));
export function validNickname(v: unknown): v is string {
  return typeof v === 'string' && v === v.trim() && v.length >= 2 && v.length <= 18 && !/[\u0000-\u001f\u007f<>]/u.test(v);
}
export function parseClientMessage(raw: string): ClientMessage | null {
  if (raw.length > NETWORK.maxMessageBytes) return null;
  let v: unknown; try { v = JSON.parse(raw); } catch { return null; }
  if (!record(v)) return null;
  if (v.type === 'hello' && exact(v, ['type','version','nickname','token']) && v.version === NETWORK.protocol && validNickname(v.nickname)
    && (v.token === undefined || (typeof v.token === 'string' && /^[a-f0-9]{64}$/.test(v.token)))) return v as ClientMessage;
  if (v.type === 'input' && exact(v, ['type','seq','x','z']) && Number.isSafeInteger(v.seq) && (v.seq as number) >= 0
    && finite(v.x) && finite(v.z) && Math.abs(v.x) <= 1 && Math.abs(v.z) <= 1) return v as ClientMessage;
  if (v.type === 'ready' && exact(v, ['type','ready']) && typeof v.ready === 'boolean') return v as ClientMessage;
  if (v.type === 'ping' && exact(v, ['type','time']) && finite(v.time) && v.time >= 0) return v as ClientMessage;
  return null;
}
export function validSnapshot(v: unknown): v is RoomSnapshot {
  if (!record(v) || typeof v.code !== 'string' || !NETWORK.roomCodePattern.test(v.code)
    || !finite(v.tick) || !finite(v.serverTime) || !['waiting','playing'].includes(v.phase as string)
    || !Array.isArray(v.players) || v.players.length > 2) return false;
  return v.players.every(p => record(p) && ['p1','p2'].includes(p.id as string) && validNickname(p.nickname)
    && finite(p.x) && finite(p.z) && finite(p.lastSeq) && typeof p.connected === 'boolean' && typeof p.ready === 'boolean')
    && new Set(v.players.map(p => p.id)).size === v.players.length;
}
export function parseServerMessage(raw: string): ServerMessage | null {
  if (raw.length > 4096) return null;
  let v: unknown; try { v = JSON.parse(raw); } catch { return null; }
  if (!record(v)) return null;
  if (v.type === 'snapshot' && validSnapshot(v.state)) return v as ServerMessage;
  if (v.type === 'welcome' && ['p1','p2'].includes(v.playerId as string) && typeof v.token === 'string'
    && /^[a-f0-9]{64}$/.test(v.token) && finite(v.expiresAt)) return v as ServerMessage;
  if (v.type === 'error' && typeof v.code === 'string' && typeof v.message === 'string') return v as ServerMessage;
  if (v.type === 'pong' && finite(v.time)) return v as ServerMessage;
  return null;
}

