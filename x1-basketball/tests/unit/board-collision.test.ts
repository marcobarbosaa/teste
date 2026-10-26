import { describe,it,expect } from 'vitest';
import { BALL, HOOP, boardDistance, createBall, stepBall, outsideBoard, sweepBoard } from '@x1/shared';
describe('tabela: varredura contínua da esfera',()=>{
  it.each([
    ['frente',[.5,3.45,-5.6],[0,0,-10],'z',1],
    ['trás',[.5,3.45,-6.5],[0,0,10],'z',-1],
    ['lateral',[1.3,3.45,-6.05],[-10,0,0],'x',1],
    ['canto',[1.3,4.375,-6.05],[-10,-10,0],'x',1],
    ['alta velocidade',[.5,3.45,-5.55],[0,0,-1200],'z',1],
  ] as const)('%s rebate e continua do lado de origem',(_,p,v,axis,sign)=>{
    const b=createBall(); b.mode='flight'; b.position={x:p[0],y:p[1],z:p[2]};b.velocity={x:v[0],y:v[1],z:v[2]};
    for(let i=0;i<8;i++)stepBall(b,1/120);
    expect(b.lastContact).toBe('board');expect(b.velocity[axis]*sign).toBeGreaterThan(0);
    expect(boardDistance(b.position).distance).toBeGreaterThanOrEqual(BALL.radius-1e-6);
  });
  it.each([15,30,60,144])('não atravessa a placa a %s Hz, mesmo fora do passo fixo',fps=>{
    const b=createBall();b.mode='flight';b.position={x:.5,y:3.45,z:-5.55};b.velocity={x:0,y:0,z:-1200};
    stepBall(b,1/fps);expect(b.contactSerial).toBeGreaterThan(0);expect(b.velocity.z).toBeGreaterThan(0);
  });
  it('cantos usam distância arredondada e penetração é removida',()=>{
    const p={x:HOOP.boardWidth/2+.09,y:HOOP.boardY+HOOP.boardHeight/2+.09,z:HOOP.boardZ};
    expect(boardDistance(p).distance).toBeGreaterThan(BALL.radius);
    expect(sweepBoard({...p,z:p.z+.5},{...p,z:p.z-.5})).toBeNull();
    expect(boardDistance(outsideBoard({x:0,y:HOOP.boardY,z:HOOP.boardZ})).distance).toBeGreaterThanOrEqual(BALL.radius);
  });
});
