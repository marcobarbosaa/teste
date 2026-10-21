import { NETWORK, validNickname } from '@x1/shared';
import { Room } from './room';
import { randomHex } from './security';
export { Room };
export interface Env { ROOMS: DurableObjectNamespace<Room>; ASSETS: Fetcher; ALLOWED_ORIGINS?: string }

// Defesa local por isolate. Limitação distribuída é requisito antes de publicação pública.
const attempts = new Map<string, { since: number; count: number }>();
function allow(request: Request, kind: string, max: number) {
  const now = Date.now();
  for (const [key, value] of attempts) if (now - value.since > 60_000) attempts.delete(key);
  const key = kind + ':' + (request.headers.get('CF-Connecting-IP') ?? 'local');
  const entry = attempts.get(key) ?? { since: now, count: 0 };
  if (!attempts.has(key) && attempts.size >= 10_000) return false;
  attempts.set(key, entry);
  return ++entry.count <= max;
}
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return Response.json({ ok: true, service: 'x1-basketball', stage: 1 });
    if (url.pathname === '/api/health/room') return env.ROOMS.get(env.ROOMS.idFromName('health')).fetch(request);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const origin = request.headers.get('Origin');
    const allowed = [url.origin, ...(env.ALLOWED_ORIGINS ?? '').split(',')];
    if (!origin || !allowed.includes(origin)) return error('Origem não permitida.', 403);
    try {
      if (url.pathname === '/api/rooms' && request.method === 'POST') {
        if (!allow(request, 'create', 20)) return error('Muitas salas criadas. Aguarde um minuto.', 429);
        if (!request.headers.get('Content-Type')?.startsWith('application/json')) return error('Formato inválido.', 415);
        const reader = request.body?.getReader();
        if (!reader) return error('Informe seu apelido.', 400);
        const parts: Uint8Array[] = []; let bytes = 0;
        while (true) {
          const part = await reader.read(); if (part.done) break;
          bytes += part.value.byteLength;
          if (bytes > NETWORK.maxMessageBytes) { await reader.cancel(); return error('Mensagem muito grande.', 413); }
          parts.push(part.value);
        }
        const joined = new Uint8Array(bytes); let offset = 0;
        for (const part of parts) { joined.set(part, offset); offset += part.length; }
        let body: unknown; try { body = JSON.parse(new TextDecoder().decode(joined)); } catch { return error('Mensagem inválida.', 400); }
        if (!body || typeof body !== 'object' || !('nickname' in body) || !validNickname(body.nickname)) return error('Use um apelido de 2 a 18 caracteres.', 400);
        for (let attempt = 0; attempt < 3; attempt++) {
          const code = randomHex(6).toUpperCase();
          const response = await env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(new Request('https://room/internal/create', { method: 'POST', body: JSON.stringify({ code, nickname: body.nickname }) }));
          if (response.status === 409) continue;
          const result = new Response(response.body, response);
          result.headers.set('Cache-Control', 'no-store');
          return result;
        }
        return error('Não foi possível criar a sala. Tente novamente.', 503);
      }
      const match = /^\/api\/rooms\/([A-F0-9]{12})\/socket$/.exec(url.pathname);
      if (match && request.method === 'GET') {
        if (!allow(request, 'connect', 60)) return error('Muitas conexões. Aguarde um minuto.', 429);
        return env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(request);
      }
      return error('Rota não encontrada.', 404);
    } catch { return error('O servidor não conseguiu processar a solicitação.', 500); }
  },
} satisfies ExportedHandler<Env>;

