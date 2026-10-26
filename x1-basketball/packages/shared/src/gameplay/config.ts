/** Metros e segundos. Cenário, limites, arremesso e colisões usam esta mesma fonte. */
export const COURT = { halfWidth: 7.5, minZ: -7, maxZ: 7, lineWidth: 0.05, laneWidth: 4.9, freeThrowZ: -1.2, threeRadius: 6.75, cornerX: 6.6 } as const;
export const HOOP = {
  x: 0, y: 3.05, z: -5.425, radius: 0.225, tube: 0.018,
  boardZ: -6.05, boardY: 3.45, boardWidth: 1.8, boardHeight: 1.05, boardDepth: 0.075,
  postZ: -7.85, postRadius: 0.16,
} as const;
export const TRAINING = { stepSeconds: 1 / 120, playerRadius: 0.34, walkSpeed: 3.8, runSpeed: 6, acceleration: 18, deceleration: 24, spawnX: 0, spawnZ: 1.5 } as const;
export const CAMERA = { distance: 8.6, height: 6, lookHeight: 1.8, smoothing: 5, yawSmoothing: 3, fov: 54, maxYaw: 0.9, maxX: 8.35, maxZ: 15.8, minZ: -5, minHeight: 4.5 } as const;
export const BALL = { radius: .12, gravity: 9.81, floorY: .04, bounce: .68, pickupRadius: .8, returnSeconds: 10 } as const;
export const SHOT = { chargeSeconds: 1.1, ideal: .72, greenHalfWidth: .07 } as const;
export const CONTACT = { boardRestitution:.7, rimRestitution:.66 } as const;
export const FINISH = {
  shortRange:2.2,layupRange:3.1,layupSpeed:1.2,layupApproach:.45,
  dunkMinRange:.65,dunkRange:2.35,dunkSpeed:4.5,dunkApproach:.82,dunkFacing:.5,dunkSide:1.3,
  fakeDuration:.64,fakeCooldown:.24,
  jump_shot:{takeoff:.04,release:.18,height:.26,recovery:.16},
  short_shot:{takeoff:.06,release:.20,height:.13,recovery:.18},
  layup:{takeoff:.16,release:.46,height:.55,recovery:.20},
  dunk:{takeoff:.12,release:.60,height:1.18,recovery:.22},
} as const;
export const PRECISION = { seed:0x1b45e7, timing:2.4, greenScale:.25, distance:.012, movement:.055, orientation:.07, spread:.018, excellent:.025,
  finishScale:{jump_shot:1,short_shot:.55,layup:.65,dunk:.1}, movementScale:{jump_shot:1,short_shot:.25,layup:.08,dunk:0},
} as const;

