import { BALL, FINISH, HOOP, PRECISION, SHOT, TRAINING } from './config';
import { stepPlayer } from './motion';
import { createBall, possessionBall } from './possession';
import { releaseQuality, shotMeter, shotVelocity } from './shooting';
import { stepBall } from './ballPhysics';
import { actionBallTarget, actionPose, contextualFinish, createAction } from './actions';
import { createLocomotion } from './locomotion';
import { outsideBoard, sweepBoard } from './boardCollision';
import { nextRandom } from './random';
import type { ActionState, GameCommand, MovementInput, TrainingView, VisualPlayer } from './types';
export class TrainingSimulation {
  time=0;
  player:VisualPlayer=this.createPlayer();
  ball=createBall();
  attempts=0;makes=0;charging=false;
  randomSeed:number=PRECISION.seed;
  action:ActionState|null=null;
  private chargeStart=0;
  private releasedAt=-100;
  private dribblePhase=Math.PI/2;
  private feedback='Sua quadra. Seu ritmo.';
  private feedbackUntil=5;
  private missReported=false;
  private queuedRecovery=false;
  private fakeReadyAt=0;
  private input:MovementInput={x:0,z:0,sprint:false};
  cameraYaw=0;
  velocity={x:0,z:0};
  private createPlayer():VisualPlayer { return {id:'p1',x:TRAINING.spawnX,z:TRAINING.spawnZ,y:0,yaw:0,speed:0,gait:0,pose:'idle',actionTime:0,hasBall:true,handHeight:1.16}; }
  setMovement(input:MovementInput){this.input=input;}
  view():TrainingView {return {attempts:this.attempts,makes:this.makes,charging:this.charging,meter:this.charging?shotMeter(this.time-this.chargeStart):0,feedback:this.time<this.feedbackUntil?this.feedback:'',ballMode:this.ball.mode,action:this.action?.kind,phase:this.action?.phase};}
  private notify(message:string){this.feedback=message;this.feedbackUntil=this.time+3;}
  private recover(){
    this.charging=false;this.player.hasBall=true;this.ball.gateEntered=false;this.ball.shotId=0;this.releasedAt=-100;
    possessionBall(this.ball,this.player,this.dribblePhase,false,TRAINING.stepSeconds,true);
  }
  private begin(kind:ActionState['kind'],meter:number){
    this.action=createAction(kind,this.player,this.ball.position,meter);this.player.action=this.action;
    this.charging=false;this.queuedRecovery=false;
    if(kind==='pump_fake')this.notify('Finta');
    else if(kind==='dunk')this.notify('Enterrada');
    else if(kind==='layup')this.notify('Bandeja');
    else this.notify(releaseQuality(meter));
  }
  command(command:GameCommand){
    if(command==='reset'){
      this.time=0;this.player=this.createPlayer();this.ball=createBall();this.velocity={x:0,z:0};this.input={x:0,z:0,sprint:false};
      this.attempts=0;this.makes=0;this.charging=false;this.action=null;this.randomSeed=PRECISION.seed;
      this.dribblePhase=Math.PI/2;this.releasedAt=-100;this.queuedRecovery=false;this.fakeReadyAt=0;this.notify('Novo treino');return;
    }
    if(command==='cancel'){this.charging=false;return;}
    if(command==='recover'){
      if(this.action){this.queuedRecovery=true;return;}
      this.recover();this.notify('Bola recuperada');return;
    }
    if(this.action || !this.player.hasBall)return;
    if(command==='charge' && !this.charging){this.charging=true;this.chargeStart=this.time;}
    else if(command==='release' && this.charging){
      const kind=Math.hypot(this.player.x-HOOP.x,this.player.z-HOOP.z)<FINISH.shortRange?'short_shot':'jump_shot';
      this.begin(kind,shotMeter(this.time-this.chargeStart));
    } else if(command==='finish' && !this.charging){
      const kind=contextualFinish(this.player,this.velocity);
      if(kind)this.begin(kind,SHOT.ideal);else this.notify('Aproxime-se da cesta para finalizar');
    } else if(command==='fake' && !this.charging && this.time>=this.fakeReadyAt)this.begin('pump_fake',SHOT.ideal);
  }
  private releaseAction(a:ActionState){
    this.attempts++;this.randomSeed=nextRandom(this.randomSeed).seed;
    this.ball.velocity=shotVelocity(this.ball.position,{...this.player,speed:a.speed,yaw:a.startYaw},a.meter,this.randomSeed,a.kind==='pump_fake'?'jump_shot':a.kind,a.bank);
    this.ball.mode='flight';this.ball.shotId=this.attempts;this.ball.scored=false;this.ball.gateEntered=false;this.ball.lastContact='none';this.ball.boardHits=0;
    this.player.hasBall=false;this.releasedAt=this.time;this.player.actionTime=0;this.player.pose='release';this.missReported=false;a.released=true;a.phase='release';
  }
  step(dt:number){
    this.time+=dt;
    const oldX=this.player.x,oldZ=this.player.z;
    stepPlayer(this.player,this.velocity,this.action?{x:0,z:0,sprint:false}:this.input,this.cameraYaw,dt,this.charging);
    this.player.actionTime=this.time-this.releasedAt;
    let releasedNow=false;
    if(this.action){
      const a=this.action;a.elapsed+=dt;actionPose(this.player,a);
      this.player.speed=Math.hypot(this.player.x-oldX,this.player.z-oldZ)/dt;
      if(!a.released){
        const target=actionBallTarget(this.player,a);
        this.ball.position=sweepBoard(this.ball.position,target)?.position??outsideBoard(target);
        this.ball.mode='held';this.ball.velocity={x:0,y:0,z:0};
        if(a.kind!=='pump_fake' && a.elapsed+1e-8>=a.releaseAt){this.releaseAction(a);releasedNow=true;}
      }
      if(a.elapsed>=a.duration){
        if(a.kind==='pump_fake')this.fakeReadyAt=this.time+FINISH.fakeCooldown;
        this.action=null;this.player.action=undefined;this.player.y=0;this.player.pose='idle';
        this.player.locomotion=createLocomotion(this.player);this.velocity={x:0,z:0};
        if(this.queuedRecovery){this.queuedRecovery=false;this.recover();this.notify('Bola recuperada');}
      }
    } else if(this.player.hasBall){
      if(this.player.speed>.12 && !this.charging)this.dribblePhase+=dt*(8+this.player.speed*1.6);else this.dribblePhase=Math.PI/2;
      possessionBall(this.ball,this.player,this.dribblePhase,this.charging,dt);
    }
    if(!this.player.hasBall && !releasedNow){
      if(stepBall(this.ball,dt)){this.makes++;this.notify('Cesta!');}
      if(this.ball.mode==='loose' && !this.ball.scored && !this.missReported){this.missReported=true;this.notify('Tente outra vez');}
      const p=this.ball.position;
      const nearby=this.ball.mode==='loose' && p.y<1.35 && Math.hypot(p.x-this.player.x,p.z-this.player.z)<BALL.pickupRadius && this.player.actionTime>.8;
      if(!this.action && nearby)this.recover();
      else if(!this.action && (this.player.actionTime>BALL.returnSeconds || Math.hypot(p.x,p.z)>25 || !Number.isFinite(p.y))){this.recover();this.notify('Bola devolvida ao treino');}
    }
  }
}
