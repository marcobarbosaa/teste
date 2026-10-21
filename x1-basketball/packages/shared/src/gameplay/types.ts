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
}
export type GameCommand = 'charge' | 'release' | 'cancel' | 'recover' | 'reset';
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
}
export interface TrainingView {
  attempts: number;
  makes: number;
  charging: boolean;
  meter: number;
  feedback: string;
  ballMode: BallState['mode'];
}

