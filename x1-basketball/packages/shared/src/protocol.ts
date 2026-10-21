export type PlayerId = 'p1' | 'p2';
export interface Position { x: number; z: number }
export interface PlayerState extends Position { id: PlayerId; nickname: string; connected: boolean; ready: boolean; lastSeq: number }
export interface RoomSnapshot { code: string; tick: number; serverTime: number; phase: 'waiting' | 'playing'; players: PlayerState[] }
export type ClientMessage =
  | { type: 'hello'; version: 1; nickname: string; token?: string }
  | { type: 'input'; seq: number; x: number; z: number }
  | { type: 'ready'; ready: boolean }
  | { type: 'ping'; time: number };
export type ServerMessage =
  | { type: 'welcome'; playerId: PlayerId; token: string; expiresAt: number }
  | { type: 'snapshot'; state: RoomSnapshot }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong'; time: number };

