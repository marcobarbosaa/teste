export const NETWORK = {
  protocol: 1, tickRate: 20, maxPlayers: 2, maxMessageBytes: 512,
  inputTimeoutMs: 250, sessionTtlMs: 30 * 60_000, emptyRoomTtlMs: 60_000,
  maxMessagesPerSecond: 40, roomCodePattern: /^[A-F0-9]{12}$/,
} as const;
export const MOVEMENT = { speed: 4, maxCoordinate: 50 } as const;
export const GAME_RULES = {
  regulationSeconds: 300, targetScore: 25, possessionSeconds: 24,
  overtimeSeconds: 60, insidePoints: 2, outsidePoints: 3,
} as const;
export const CONTROLS = { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD',
  sprint: 'ShiftLeft', shotOrBlock: 'Space', dribbleOrStance: 'KeyJ', protectOrSteal: 'KeyK', recover: 'KeyR', finish:'KeyE', fake:'KeyF' } as const;

