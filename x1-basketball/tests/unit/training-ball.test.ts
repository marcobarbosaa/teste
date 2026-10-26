import { describe, expect, it } from 'vitest';
import { BALL, HOOP, SHOT, TRAINING, TrainingSimulation, createBall, detectBasket, shotVelocity, stepBall } from '@x1/shared';

const advance = (sim: TrainingSimulation, seconds: number) => {
  for (let i = 0; i < Math.round(seconds / TRAINING.stepSeconds); i++) sim.step(TRAINING.stepSeconds);
};
function shoot(sim: TrainingSimulation, meter = SHOT.ideal) {
  sim.command('charge'); advance(sim, SHOT.chargeSeconds * meter); sim.command('release'); advance(sim,.2);
}
describe('treino: bola e resultado físico', () => {
  it('soltura precisa percorre uma parábola e contabiliza uma cesta apenas uma vez', () => {
    const sim = new TrainingSimulation(); shoot(sim);
    expect(sim.ball.mode).toBe('flight'); expect(sim.attempts).toBe(1); expect(sim.makes).toBe(0);
    const release = { ...sim.ball.position };
    advance(sim, .6);
    expect(sim.ball.position.y).toBeGreaterThan(release.y + 2);
    expect(sim.ball.position.z).toBeLessThan(release.z - 1);
    advance(sim, 2);
    expect(sim.makes).toBe(1);
    advance(sim, 3); expect(sim.makes).toBe(1);
  });
  it('soltura antecipada erra, R recupera sem zerar e reiniciar limpa estatísticas', () => {
    const sim = new TrainingSimulation(); shoot(sim, .2); advance(sim, 4);
    expect(sim.makes).toBe(0); expect(sim.attempts).toBe(1);
    sim.command('recover'); expect(sim.player.hasBall).toBe(true); expect(sim.ball.mode).toBe('held');
    shoot(sim); advance(sim, 3); expect(sim.makes).toBe(1); expect(sim.attempts).toBe(2);
    sim.command('reset'); expect(sim.view()).toMatchObject({ attempts: 0, makes: 0, charging: false, ballMode: 'held' });
    expect(sim.player.z).toBe(TRAINING.spawnZ);
  });
  it('cancela preparação sem tentativa e não arremessa outra bola enquanto a primeira está livre', () => {
    const sim = new TrainingSimulation(); sim.command('charge'); advance(sim, .5); sim.command('cancel'); sim.command('release');
    expect(sim.attempts).toBe(0); shoot(sim);
    sim.command('charge'); sim.command('release'); expect(sim.attempts).toBe(1);
  });
  it('drible acompanha o movimento sem atravessar o chão', () => {
    const sim = new TrainingSimulation(); sim.setMovement({ x: 1, z: 0, sprint: true });
    const heights: number[] = [];
    for (let i = 0; i < 120; i++) { sim.step(TRAINING.stepSeconds); heights.push(sim.ball.position.y); }
    expect(sim.ball.mode).toBe('dribbling');
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(BALL.floorY + BALL.radius);
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(.7);
    expect(Math.hypot(sim.ball.position.x - sim.player.x, sim.ball.position.z - sim.player.z)).toBeLessThan(.6);
  });
  it('inicia drible no alto e aproxima a bola suavemente da pose de preparação', () => {
    const sim = new TrainingSimulation();
    sim.setMovement({x:1,z:0,sprint:false}); sim.step(TRAINING.stepSeconds);
    expect(sim.ball.position.y).toBeGreaterThan(.98);
    const before = sim.ball.position.y;
    sim.command('charge'); sim.step(TRAINING.stepSeconds);
    expect(sim.ball.position.y).toBeGreaterThan(before);
    expect(sim.ball.position.y - before).toBeLessThan(.2);
  });
  it('recupera por proximidade e devolve automaticamente quando fica fora de alcance', () => {
    const sim = new TrainingSimulation(); shoot(sim); advance(sim, 1);
    sim.ball.mode = 'loose'; sim.ball.position = { x: sim.player.x + .3, y: .3, z: sim.player.z };
    sim.ball.velocity = { x: 0, y: 0, z: 0 }; advance(sim, .05);
    expect(sim.player.hasBall).toBe(true);
    shoot(sim, .1); advance(sim, BALL.returnSeconds + .1);
    expect(sim.player.hasBall).toBe(true); expect(sim.attempts).toBe(2);
  });
  it('velocidade e distância alteram o lançamento sem decidir a pontuação', () => {
    const sim = new TrainingSimulation();
    const still = shotVelocity(sim.ball.position, sim.player, SHOT.ideal, 1);
    const moving = shotVelocity(sim.ball.position, { ...sim.player, speed: 5 }, SHOT.ideal, 1);
    expect(moving.x).not.toBe(still.x); expect(sim.makes).toBe(0);
  });
});
describe('sensor geométrico do aro', () => {
  it('exige travessia completa descendente e rejeita proximidade, subida e entrada lateral', () => {
    const ball = createBall(); ball.mode = 'flight'; ball.shotId = 1;
    ball.position = { x: 0, y: HOOP.y, z: HOOP.z }; ball.velocity.y = -2;
    expect(detectBasket({ ...ball.position, y: HOOP.y + .3 }, ball)).toBe(false);
    expect(ball.gateEntered).toBe(true);
    const previous = { ...ball.position }; ball.position.y = HOOP.y - .3;
    expect(detectBasket(previous, ball)).toBe(true); expect(detectBasket(previous, ball)).toBe(false);
    for (const [x, vy, from, to] of [[0, 3, -.3, .3], [.3, -3, .3, -.3], [0, -3, 0, -.3]]) {
      const b = createBall(); b.shotId = 1; b.velocity.y = vy; b.position = { x, y: HOOP.y + to, z: HOOP.z };
      expect(detectBasket({ x, y: HOOP.y + from, z: HOOP.z }, b)).toBe(false);
    }
  });
});
describe('colisões alinhadas à geometria', () => {
  it('tabela reflete a bola inclusive em alta velocidade, sem atravessar a placa', () => {
    const ball = createBall(); ball.mode = 'flight';
    ball.position = { x: .6, y: HOOP.boardY, z: HOOP.boardZ + .3 }; ball.velocity = { x: 0, y: 0, z: -35 };
    for (let i=0;i<4;i++) stepBall(ball, TRAINING.stepSeconds);
    expect(ball.lastContact).toBe('board'); expect(ball.velocity.z).toBeGreaterThan(0);
    expect(ball.position.z).toBeGreaterThan(HOOP.boardZ);
  });
  it('aro repele uma bola que cai sobre o tubo e não conta cesta', () => {
    const ball = createBall(); ball.mode = 'flight'; ball.shotId = 1;
    ball.position = { x: HOOP.radius, y: HOOP.y + .25, z: HOOP.z }; ball.velocity.y = -8;
    let scored = false; for (let i=0;i<4;i++) scored = stepBall(ball, TRAINING.stepSeconds) || scored;
    expect(ball.lastContact).toBe('rim'); expect(ball.velocity.y).toBeGreaterThan(0); expect(scored).toBe(false);
  });
  it('piso produz quique e repouso acima da superfície', () => {
    const ball = createBall(); ball.mode = 'flight'; ball.position.y = .2; ball.velocity.y = -5;
    stepBall(ball, TRAINING.stepSeconds); stepBall(ball, TRAINING.stepSeconds);
    expect(ball.lastContact).toBe('floor'); expect(ball.velocity.y).toBeGreaterThan(0); expect(ball.mode).toBe('loose');
    for (let i=0;i<1200;i++) stepBall(ball, TRAINING.stepSeconds);
    expect(ball.position.y).toBeGreaterThanOrEqual(BALL.floorY + BALL.radius);
    expect(Math.abs(ball.velocity.y)).toBeLessThan(.1);
  });
});
