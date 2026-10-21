import { Canvas } from '@react-three/fiber';
import { memo } from 'react';
import { Court } from './Court';
import { Player } from './Player';
import { FollowCamera } from './FollowCamera';
import type { GameConnection } from '../network/GameConnection';
import type { PlayerId } from '@x1/shared';
export const Scene = memo(function Scene({ connection, ids, active }: { connection: GameConnection; ids: string; active: boolean }) {
  return <Canvas frameloop={active ? 'always' : 'demand'} dpr={[1, 1.5]} shadows camera={{ position: [12, 11, 15], fov: 45 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
    <color attach="background" args={['#182c2b']}/><fog attach="fog" args={['#182c2b', 28, 65]}/>
    <ambientLight intensity={1.4}/><directionalLight position={[8, 16, 8]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]}/>
    <Court/>
    {ids.split(',').filter(Boolean).map(id => <Player key={id} id={id as PlayerId} connection={connection}/>)}
    <FollowCamera connection={connection}/>
  </Canvas>;
});

