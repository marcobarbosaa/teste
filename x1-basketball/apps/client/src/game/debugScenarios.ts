import { HOOP, createBall, type TrainingSimulation } from '@x1/shared';
/** Cenários de diagnóstico, importados somente por builds de desenvolvimento. */
export function loadDebugScenario(sim: TrainingSimulation, name: string) {
  const fixtures: Record<string, {p:number[];v:number[]}> = {
    'board-front':{p:[.55,3.45,-4.6],v:[0,1,-8]},
    'board-back':{p:[.55,3.45,-7.5],v:[0,1,8]},
    'board-side':{p:[1.6,3.45,HOOP.boardZ],v:[-8,1,0]},
    'board-corner':{p:[1.4,4.4,HOOP.boardZ],v:[-5,-5,0]},
    'board-fast':{p:[.55,3.45,HOOP.boardZ+.5],v:[0,0,-1200]},
  };
  const f=fixtures[name]; if(!f) return false;
  sim.command('reset'); sim.command('charge'); for(let i=0;i<96;i++)sim.step(1/120);sim.command('release');for(let i=0;i<180;i++)sim.step(1/120);sim.player.hasBall=false;sim.makes=0;sim.ball=createBall();
  sim.ball.mode='flight'; sim.ball.shotId=1; sim.attempts=1;
  sim.ball.position={x:f.p[0],y:f.p[1],z:f.p[2]}; sim.ball.velocity={x:f.v[0],y:f.v[1],z:f.v[2]};
  return true;
}
