import {describe,it,expect} from 'vitest';
import {LocalGameController} from '../../apps/client/src/game/LocalGameController';
import {BALL,HOOP,SHOT,TrainingSimulation,bankVelocity,createBall,stepBall,contextualFinish,towardHoopYaw,releaseQuality,nextRandom,boardDistance} from '@x1/shared';
const advance=(s:TrainingSimulation,t:number)=>{for(let i=0;i<Math.round(t*120);i++)s.step(1/120);};
function setup(x:number,z:number,speed:number){const s=new TrainingSimulation();s.player.x=x;s.player.z=z;s.player.yaw=towardHoopYaw(x,z);s.player.speed=speed;const yaw=s.player.yaw;s.velocity={x:-Math.sin(yaw)*speed,z:-Math.cos(yaw)*speed};s.command('recover');return s;}
describe('ações contextuais com posse e fases físicas',()=>{
  it('curta próxima e debaixo do aro sobe sem bater na face inferior',()=>{
    for(let i=0;i<25;i++) {
      const s=setup(0,-3.3-i*.1,0);s.command('finish');
      let previous={...s.ball.position};
      for(let n=0;n<300;n++) {
        const held=s.player.hasBall;s.step(1/120);
        if(held&&s.player.hasBall)expect(Math.hypot(s.ball.position.x-previous.x,s.ball.position.y-previous.y,s.ball.position.z-previous.z)).toBeLessThan(.16);
        expect(s.ball.lastContact).not.toBe('rim');
        previous={...s.ball.position};
      }
      expect(s.makes).toBe(1);expect(s.attempts).toBe(1);
    }
  });
  it.each([15,30,60,144])('enterrada e contagem permanecem consistentes a %s FPS',fps=>{
    const c=new LocalGameController(),s=c.simulation;s.player.x=0;s.player.z=-3.5;s.player.speed=6;s.velocity.z=-6;c.command('recover');c.command('finish');
    for(let i=0;i<fps*3;i++)c.advance(1/fps);
    expect(s.makes).toBe(1);expect(s.attempts).toBe(1);expect(s.action).toBeNull();expect(s.player.y).toBe(0);
  });
  it.each([['short_shot',0,-4.3,0],['layup',.7,-3.4,2.8],['layup',-.7,-3.4,2.8],['dunk',.2,-3.4,5.5]] as const)('%s em x=%s: segura, solta e aterrissa',(kind,x,z,speed)=>{
    const s=setup(x,z,speed);s.command('finish');expect(s.action?.kind).toBe(kind);expect(s.attempts).toBe(0);
    expect(s.player.hasBall).toBe(true);const phases=new Set<string>();let peak=0,maxStep=0,prev={...s.ball.position},released=false;
    for(let i=0;i<240;i++){
      const held=s.player.hasBall;s.step(1/120);if(s.action)phases.add(s.action.phase);peak=Math.max(peak,s.player.y??0);
      if(held && s.player.hasBall)maxStep=Math.max(maxStep,Math.hypot(s.ball.position.x-prev.x,s.ball.position.y-prev.y,s.ball.position.z-prev.z));
      if(held&&!s.player.hasBall){released=true;expect(s.ball.mode).toBe('flight');if(kind==='dunk')expect(s.ball.position.y).toBeGreaterThan(HOOP.y+BALL.radius);}
      expect(boardDistance(s.ball.position).distance).toBeGreaterThanOrEqual(BALL.radius-1e-6);prev={...s.ball.position};
    }
    expect(released).toBe(true);expect(maxStep).toBeLessThan(.16);expect(s.attempts).toBe(1);expect(s.action).toBeNull();expect(s.player.y).toBe(0);
    expect(phases.has('execute')).toBe(true);expect(phases.has('landing')).toBe(true);expect(peak).toBeGreaterThan(.1);
    expect(s.makes).toBe(1);advance(s,2);expect(s.makes).toBe(1);
  });
  it('não permite enterrada longe, sem impulso, de costas, por trás, em fuga ou sem bola',()=>{
    for(const [x,z,speed] of [[0,-1,6],[0,-3.5,0],[2,-4.7,6],[0,-6.5,6]]){
      const s=setup(x,z,speed);expect(contextualFinish(s.player,s.velocity)).not.toBe('dunk');
    }
    const s=setup(0,-3.5,6);s.player.yaw=Math.PI;expect(contextualFinish(s.player,s.velocity)).not.toBe('dunk');
    s.player.yaw=0;s.velocity.z=6;expect(contextualFinish(s.player,s.velocity)).not.toBe('dunk');s.player.hasBall=false;expect(contextualFinish(s.player,{x:0,z:-6})).toBeNull();
  });
  it('finta não solta nem duplica; Espaço não conflita, reset cancela tudo',()=>{
    const s=new TrainingSimulation();s.command('fake');advance(s,.25);expect(s.player.hasBall).toBe(true);expect(s.ball.position.y).toBeGreaterThan(1.4);
    const elapsed=s.action!.elapsed;s.command('fake');s.command('charge');s.command('release');expect(s.action!.elapsed).toBe(elapsed);
    advance(s,.5);expect(s.action).toBeNull();expect(s.attempts).toBe(0);expect(s.player.hasBall).toBe(true);
    s.command('charge');advance(s,.8);s.command('fake');expect(s.action).toBeNull();s.command('release');expect(s.action?.kind).toBe('jump_shot');
    s.command('reset');advance(s,2);expect(s.attempts).toBe(0);expect(s.player.y).toBe(0);
  });
  it('R durante enterrada aguarda aterrissagem e ações repetidas não duplicam lançamento',()=>{
    const s=setup(0,-3.5,6);s.command('finish');s.command('recover');s.command('finish');s.command('fake');advance(s,.65);
    expect(s.player.hasBall).toBe(false);expect(s.attempts).toBe(1);advance(s,1);expect(s.player.hasBall).toBe(true);expect(s.action).toBeNull();
  });
  it('Espaço prolongado satura o medidor e lança após extensão, sem travar',()=>{
    const s=new TrainingSimulation();s.command('charge');advance(s,6);expect(s.view().meter).toBe(1);s.command('release');
    expect(s.attempts).toBe(0);expect(s.player.hasBall).toBe(true);advance(s,.2);expect(s.attempts).toBe(1);advance(s,1);expect(s.action).toBeNull();
    expect(releaseQuality(1)).toBe('Muito tarde');expect(releaseQuality(0)).toBe('Muito cedo');expect(releaseQuality(SHOT.ideal)).toBe('Excelente');
  });
});
describe('tabela como parte da trajetória',()=>{
  it.each([['cesta',0,1],['erro',.65,0]] as const)('impacto seguido de %s',(_,offset,expected)=>{
    const b=createBall();b.position={x:.5,y:2.5,z:-4.7};b.mode='flight';b.shotId=1;
    b.velocity=bankVelocity(b.position,{x:offset,y:HOOP.y,z:HOOP.z},3.72);
    let board=false,makes=0;
    for(let i=0;i<360;i++){if(stepBall(b,1/120))makes++;if(b.lastContact==='board')board=true;}
    expect(board).toBe(true);expect(makes).toBe(expected);
  });
  it('PRNG é reproduzível e não alterna lados entre tentativas',()=>{
    const run=()=>{let seed=12345;return Array.from({length:10},()=>{const n=nextRandom(seed);seed=n.seed;return n.value;});};
    const a=run();expect(a).toEqual(run());expect(a.some((v,i)=>i>0 && (v>.5)===(a[i-1]>.5))).toBe(true);
  });
});
