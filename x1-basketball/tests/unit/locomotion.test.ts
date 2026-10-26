import {it,expect} from 'vitest';
import {TrainingSimulation} from '@x1/shared';
it.each([['walk',0,-1,false],['run',0,-1,true],['strafe',1,0,false],['backpedal',0,1,false]] as const)('%s acompanha velocidade e direção',(kind,x,z,sprint)=>{
  const s=new TrainingSimulation();s.setMovement({x,z,sprint});for(let i=0;i<80;i++)s.step(1/120);
  expect(s.player.locomotion?.kind).toBe(kind);expect(s.player.locomotion?.cycle).toBeGreaterThan(0);
  s.setMovement({x:0,z:0,sprint:false});s.step(1/120);expect(s.player.locomotion?.kind).toBe('stop');
  for(let i=0;i<180;i++)s.step(1/120);expect(s.player.locomotion?.kind).toBe('idle');
});
it('apoio mantém o pé no mundo; inversão produz reação gradual',()=>{
  const s=new TrainingSimulation();s.setMovement({x:0,z:-1,sprint:false});for(let i=0;i<30;i++)s.step(1/120);
  let checked=0;
  for(let i=0;i<60;i++){
    const before=structuredClone(s.player.locomotion!);s.step(1/120);const now=s.player.locomotion!;
    if(before.left.stance&&now.left.stance){expect(Math.hypot(before.left.position.x-now.left.position.x,before.left.position.z-now.left.position.z)).toBeLessThan(.02);checked++;}
  }
  expect(checked).toBeGreaterThan(3);s.setMovement({x:0,z:1,sprint:false});s.step(1/120);
  expect(s.player.locomotion?.kind).toBe('pivot');expect(s.player.locomotion?.leanX).toBeLessThan(.22);
});
