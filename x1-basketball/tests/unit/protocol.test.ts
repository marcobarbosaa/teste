import { describe, expect, it } from 'vitest';
import { parseClientMessage, parseServerMessage, validNickname } from '@x1/shared';
describe('protocolo não confia no cliente', () => {
  it('aceita apenas comandos tipados e limita apelido', () => {
    expect(parseClientMessage(JSON.stringify({ type:'hello', version:1, nickname:'Marco' }))).not.toBeNull();
    expect(validNickname(' A')).toBe(false);
    expect(validNickname('a'.repeat(19))).toBe(false);
    expect(validNickname('<script>')).toBe(false);
  });
  it.each(['{', 'null', '[]', '{"type":"score","points":25}', '{"type":"input","seq":1,"x":999,"z":0}', '{"type":"input","seq":-1,"x":0,"z":0}', '{"type":"input","seq":1,"x":0,"z":0,"playerId":"p2"}', '{"type":"hello","version":2,"nickname":"Ana"}', 'x'.repeat(513)])('rejeita payload inválido: %s', raw => { expect(parseClientMessage(raw)).toBeNull(); });
  it('rejeita estados inválidos recebidos pelo cliente', () => {
    expect(parseServerMessage('{"type":"snapshot","state":{"players":[]}}')).toBeNull();
    expect(parseServerMessage('{"type":"welcome","playerId":"p3","token":"abc","expiresAt":1}')).toBeNull();
  });
});

