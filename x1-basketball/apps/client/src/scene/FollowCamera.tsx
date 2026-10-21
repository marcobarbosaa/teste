import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { GameConnection } from '../network/GameConnection';
export function FollowCamera({ connection }: { connection: GameConnection }) {
  const target = useRef(new Vector3(0, 0, 0));
  const offset = useRef(new Vector3());
  useFrame(({ camera, invalidate }, delta) => {
    const id = connection.getView().playerId;
    const point = id && connection.sample(id, performance.now());
    if (!point) { camera.position.set(12, 11, 15); camera.lookAt(0, 0, 0); target.current.set(0, 0, 0); return; }
    offset.current.set(point.x, 5.2, point.z + 7.5);
    const t = 1 - Math.exp(-7 * Math.min(delta, 0.1));
    camera.position.lerp(offset.current, t);
    target.current.lerp(offset.current.set(point.x, 1, point.z - 3.5), t);
    camera.lookAt(target.current);
    if (target.current.distanceTo(offset.current) > 0.001 || camera.position.distanceTo(offset.current.set(point.x, 5.2, point.z + 7.5)) > 0.001) invalidate();
  });
  return null;
}

