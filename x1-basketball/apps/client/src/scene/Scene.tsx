import { Canvas, useFrame } from '@react-three/fiber';
import { memo, useCallback, useState } from 'react';
import { PCFSoftShadowMap } from 'three';
import { CAMERA, type PlayerId } from '@x1/shared';
import { Court } from './Court';
import { Player } from './Player';
import { FollowCamera } from './FollowCamera';
import { BasketballHoop } from './BasketballHoop';
import { StreetEnvironment } from './StreetEnvironment';
import { GraphicsGuard } from './GraphicsGuard';
import { Basketball } from './Basketball';
import type { GameController } from '../game/GameController';
function SimulationLoop({ controller }: { controller: GameController }) {
  useFrame((_, delta) => controller.advance(delta), -2);
  return null;
}
export const Scene = memo(function Scene({ controller, ids, active }: { controller: GameController; ids: string; active: boolean }) {
  const [failure, setFailure] = useState<Error | null>(null);
  const onFailure = useCallback((error: Error) => setFailure(error), []);
  if (failure) throw failure;
  return <Canvas frameloop={active ? 'always' : 'demand'} dpr={[1, 1.5]} shadows camera={{ position: [0, 6, 10], fov: CAMERA.fov, near: .1, far: 120 }}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => { gl.shadowMap.type = PCFSoftShadowMap; }}>
    <color attach="background" args={['#c9d9d5']}/><fog attach="fog" args={['#c9d9d5', 27, 85]}/>
    <hemisphereLight args={['#e3f0ef', '#9e8f71', 2]}/>
    <directionalLight position={[-10, 18, 8]} intensity={2.7} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-normalBias={.035}/>
    <StreetEnvironment/><Court/><BasketballHoop/>
    <SimulationLoop controller={controller}/>
    {controller.mode === 'training' && <Basketball controller={controller}/>}
    {ids.split(',').filter(Boolean).map(id => <Player key={id} id={id as PlayerId} controller={controller}/>)}
    <FollowCamera controller={controller}/><GraphicsGuard onFailure={onFailure}/>
  </Canvas>;
});
