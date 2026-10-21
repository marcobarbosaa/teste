import { beforeEach, describe, expect, it } from 'vitest';
import { move, MOVEMENT, NETWORK } from '@x1/shared';
import { Simulation } from '../../apps/server/src/simulation';
import { RateLimit } from '../../apps/server/src/security';
describe('simulação autoritativa', () => {
  let sim: Simulation;
  beforeEach(() => { sim = new Simulation({ code:'AABBCCDDEEFF', seats:[], expiresAt:100_000, tick:0 }); });
  const token = (n: number) => String(n).repeat(64);
  function start() {
    sim.join('Ana', undefined, 0, () => token(1));
    sim.join('Beto', undefined, 0, () => token(2));
    sim.ready('p1', true); sim.ready('p2', true);
  }
  it('exige dois participantes prontos', () => {
    sim.join('Ana', undefined, 0, () => token(1)); sim.ready('p1', true);
    expect(sim.phase).toBe('waiting');
    sim.join('Beto', undefined, 0, () => token(2));
    expect(sim.phase).toBe('waiting');
    sim.ready('p2', true); expect(sim.phase).toBe('playing');
  });
  it('bloqueia terceiro mesmo após desconexão e exige token válido', () => {
    start(); sim.disconnect('p1');
    expect(() => sim.join('Intruso', undefined, 10, () => token(3))).toThrow('dois jogadores');
    expect(() => sim.join('Intruso', token(3), 10, () => token(3))).toThrow('Sessão inválida');
    expect(sim.join('Ana', token(1), 10, () => token(3)).player.id).toBe('p1');
    expect(() => sim.join('Ana', token(1), 10, () => token(3))).toThrow('já está conectada');
  });
  it('não permite sessão expirada', () => { start(); sim.disconnect('p1'); expect(() => sim.join('Ana', token(1),100_000, () => token(3))).toThrow('expirou'); });
  it('só simula depois da confirmação e controla apenas a vaga associada', () => {
    start(); const before = { ...sim.player('p2')! };
    sim.input('p1', { x:1,z:0,seq:0,receivedAt:0 }); sim.step(50);
    expect(sim.player('p1')!.x).toBeCloseTo(-1.5 + MOVEMENT.speed / NETWORK.tickRate);
    expect(sim.player('p2')).toEqual(before);
    sim.ready('p1', false); const x=sim.player('p1')!.x; sim.step(100); expect(sim.player('p1')!.x).toBe(x);
  });
  it('flood não aumenta distância por tick; sequências antigas são ignoradas', () => {
    start();
    for(let seq=0;seq<100;seq++) sim.input('p1',{x:1,z:0,seq,receivedAt:0});
    sim.input('p1',{x:-1,z:0,seq:1,receivedAt:1});
    sim.step(50); expect(sim.player('p1')!.x).toBeCloseTo(-1.3);
    expect(sim.player('p1')!.lastSeq).toBe(99);
  });
  it('para input obsoleto e pausa ao desconectar', () => {
    start(); sim.input('p1',{x:1,z:0,seq:0,receivedAt:0}); sim.step(300);
    expect(sim.player('p1')!.x).toBe(-1.5);
    sim.disconnect('p2'); expect(sim.phase).toBe('waiting');
    expect(sim.player('p1')!.ready).toBe(false);
    expect(sim.intents.size).toBe(0);
  });
  it('snapshot não expõe tokens ou expirações privadas', () => {
    start(); const raw=JSON.stringify(sim.snapshot(0));
    expect(raw).not.toContain('token'); expect(raw).not.toContain('expiresAt');
  });
  it('normaliza diagonal e limita duração de previsão', () => {
    const straight=move({x:0,z:0},{x:1,z:0},.05);
    const diagonal=move({x:0,z:0},{x:1,z:1},.05);
    expect(Math.hypot(diagonal.x,diagonal.z)).toBeCloseTo(straight.x);
    expect(move({x:0,z:0},{x:1,z:0},99).x).toBeCloseTo(.4);
  });
  it('limita frequência por conexão', () => {
    const limiter=new RateLimit(2);
    expect(limiter.allow('a',0)).toBe(true); expect(limiter.allow('a',0)).toBe(true);
    expect(limiter.allow('a',0)).toBe(false); expect(limiter.allow('b',0)).toBe(true);
    expect(limiter.allow('a',1001)).toBe(true);
  });
});

