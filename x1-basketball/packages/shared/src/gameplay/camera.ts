import { CAMERA, HOOP } from './config';
import { towardHoopYaw } from './motion';
export function cameraYaw(x: number, z: number) {
  return Math.max(-CAMERA.maxYaw, Math.min(CAMERA.maxYaw, towardHoopYaw(x, z)));
}
export function cameraPose(x: number, z: number, yaw = cameraYaw(x, z)) {
  return {
    position: {
      x: Math.max(-CAMERA.maxX, Math.min(CAMERA.maxX, x + Math.sin(yaw) * CAMERA.distance)),
      y: Math.max(CAMERA.minHeight, CAMERA.height),
      z: Math.max(CAMERA.minZ, Math.min(CAMERA.maxZ, z + Math.cos(yaw) * CAMERA.distance)),
    },
    target: { x: x * 0.55, y: CAMERA.lookHeight, z: z * 0.55 + HOOP.z * 0.45 },
  };
}

