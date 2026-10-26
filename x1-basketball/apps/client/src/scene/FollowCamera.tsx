import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { CAMERA, angleDelta, cameraPose, cameraYaw } from '@x1/shared';
import type { GameController } from '../game/GameController';

export function FollowCamera({ controller }: { controller: GameController }) {
  const target = useRef(new Vector3());
  const offset = useRef(new Vector3());
  const yaw = useRef(0);
  const initialized = useRef(false);
  useFrame(({ camera, invalidate }, delta) => {
    const id = controller.localPlayerId();
    const player = id && controller.samplePlayer(id, performance.now());
    if (!player) { camera.position.set(12, 11, 15); camera.lookAt(0, 0, 0); initialized.current = false; return; }
    if (controller.mode === 'training') {
      const wantedYaw = cameraYaw(player.x, player.z);
      yaw.current += angleDelta(yaw.current, wantedYaw) * (1 - Math.exp(-CAMERA.yawSmoothing * Math.min(delta, .1)));
      const pose = cameraPose(player.x, player.z, yaw.current);
      const lift=player.y??0;
      pose.position.y+=lift*.35;pose.target.y+=lift*.35;
      const blend = initialized.current ? 1 - Math.exp(-CAMERA.smoothing * Math.min(delta, .1)) : 1;
      camera.position.lerp(offset.current.set(pose.position.x, pose.position.y, pose.position.z), blend);
      target.current.lerp(offset.current.set(pose.target.x, pose.target.y, pose.target.z), blend);
      camera.lookAt(target.current);
      controller.setCameraYaw(Math.atan2(camera.position.x - target.current.x, camera.position.z - target.current.z));
    } else {
      const t = initialized.current ? 1 - Math.exp(-7 * Math.min(delta, .1)) : 1;
      camera.position.lerp(offset.current.set(player.x, 5.2, player.z + 7.5), t);
      target.current.lerp(offset.current.set(player.x, 1, player.z - 3.5), t);
      camera.lookAt(target.current);
      if (camera.position.distanceTo(offset.current.set(player.x, 5.2, player.z + 7.5)) > .001) invalidate();
    }
    initialized.current = true;
  });
  return null;
}
