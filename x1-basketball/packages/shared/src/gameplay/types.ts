import type { PlayerId, Position } from '../protocol';

export interface MovementInput extends Position { sprint: boolean }
export interface VisualPlayer extends Position {
  id: PlayerId;
  yaw: number;
  speed: number;
  gait: number;
  pose: 'idle' | 'move' | 'charge' | 'release';
  actionTime: number;
  hasBall: boolean;
  handHeight: number;
  y?: number;
  locomotion?: LocomotionState;
  action?: ActionState;
}
export type LocomotionKind='idle'|'walk'|'run'|'strafe'|'backpedal'|'stop'|'pivot';
export interface FootState { position:Vec3; plant:Vec3; from:Vec3; stance:boolean }
export interface LocomotionState { kind:LocomotionKind; cycle:number; weight:number; forward:number; lateral:number; leanX:number; leanZ:number; twist:number; left:FootState; right:FootState }
export type GameCommand = 'charge' | 'release' | 'cancel' | 'recover' | 'reset' | 'finish' | 'fake';
export type FinishKind='jump_shot'|'short_shot'|'layup'|'dunk';
export interface ActionState {
  kind:FinishKind|'pump_fake';phase:'prepare'|'execute'|'release'|'landing'|'recover';
  elapsed:number;releaseAt:number;duration:number;takeoff:number;jumpHeight:number;
  released:boolean;hand:-1|1;bank:boolean;meter:number;speed:number;startYaw:number;
  start:{x:number;z:number};end:{x:number;z:number};ballStart:Vec3;
}
export interface Vec3 { x: number; y: number; z: number }
export type BallContact = 'none' | 'floor' | 'rim' | 'board' | 'fence' | 'post';
export interface BallState {
  position: Vec3;
  velocity: Vec3;
  mode: 'held' | 'dribbling' | 'flight' | 'loose';
  spin: number;
  shotId: number;
  scored: boolean;
  gateEntered: boolean;
  lastContact: BallContact;
  contactSerial: number;
  boardHits?: number;
  contactPoint?: Vec3;
  contactNormal?: Vec3;
}
export interface TrainingView {
  attempts: number;
  makes: number;
  charging: boolean;
  meter: number;
  feedback: string;
  ballMode: BallState['mode'];
  action?: ActionState['kind'];
  phase?: ActionState['phase'];
}

