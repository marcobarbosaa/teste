export interface Session { code: string; nickname: string; token?: string; expiresAt?: number }
const KEY = 'x1-session-v1';
export function readSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Session | null;
    if (!value || typeof value.code !== 'string' || typeof value.nickname !== 'string' || (value.expiresAt && value.expiresAt < Date.now())) return null;
    return value;
  } catch { return null; }
}
export function saveSession(value: Session) { try { sessionStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Memória continua funcionando se armazenamento estiver bloqueado. */ } }
export function clearSession() { try { sessionStorage.removeItem(KEY); } catch { /* noop */ } }

