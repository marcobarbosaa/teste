import { useMemo } from 'react';
import { Wire } from './geometry';

function Fence({ width, position, rotation = 0 }: { width: number; position: [number, number, number]; rotation?: number }) {
  const segments = useMemo(() => {
    const points: number[] = [], height = 2.7;
    for (let sign of [-1, 1]) for (let x = -width / 2 - height; x < width / 2 + height; x += .32) {
      // Diagonais aparadas nas bordas do painel.
      const startY = Math.max(0, sign === 1 ? -width / 2 - x : x - width / 2);
      const endY = Math.min(height, sign === 1 ? width / 2 - x : x + width / 2);
      if (endY > startY) points.push(x + sign * startY, startY, 0, x + sign * endY, endY, 0);
    }
    return points;
  }, [width]);
  return <group position={position} rotation={[0, rotation, 0]}>
    <Wire segments={segments} color="#45605b" opacity={.45}/>
    {[-width / 2, 0, width / 2].map(x => <mesh key={x} position={[x, 1.4, 0]} castShadow><cylinderGeometry args={[.04, .04, 2.8, 6]}/><meshStandardMaterial color="#455b58"/></mesh>)}
    <mesh position={[0, 2.72, 0]}><boxGeometry args={[width, .045, .045]}/><meshStandardMaterial color="#455b58"/></mesh>
  </group>;
}
export function StreetEnvironment() {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.06, 0]} receiveShadow><planeGeometry args={[160, 160]}/><meshStandardMaterial color="#bcc1b0" roughness={1}/></mesh>
    <Fence width={19} position={[0, 0, -8.6]}/>
    <Fence width={17} position={[-9, 0, -.1]} rotation={Math.PI / 2}/>
    <Fence width={17} position={[9, 0, -.1]} rotation={Math.PI / 2}/>
    <group position={[-11, 0, -1]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, .5, 0]} castShadow><boxGeometry args={[2.5, .12, .55]}/><meshStandardMaterial color="#907158"/></mesh>
      <mesh position={[0, .9, -.25]} castShadow><boxGeometry args={[2.5, .6, .09]}/><meshStandardMaterial color="#907158"/></mesh>
      {[-.85, .85].map(x => <mesh key={x} position={[x, .24, 0]}><boxGeometry args={[.08, .5, .38]}/><meshStandardMaterial color="#354e49"/></mesh>)}
    </group>
    {[[12, -11, 5, 8], [-13, -14, 7, 10], [4, -23, 9, 12], [-7, -28, 8, 9]].map(([x, z, width, height], i) =>
      <group key={i}><mesh position={[x, height / 2 - .1, z]}><boxGeometry args={[width, height, 5]}/><meshStandardMaterial color={['#9ca59d','#b5b3a4','#a0aea5','#aeb6aa'][i]}/></mesh>
        {[2, 4, 6].filter(y => y < height).map(y => <mesh key={y} position={[x, y, z + 2.51]}><boxGeometry args={[width * .65, .85, .03]}/><meshStandardMaterial color="#788e89"/></mesh>)}
      </group>)}
    {[[-11, -9], [11, -8], [-14, 7]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
      <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[.13, .19, 3.2, 7]}/><meshStandardMaterial color="#756b54"/></mesh>
      <mesh position={[0, 3.8, 0]} castShadow><icosahedronGeometry args={[1.8, 1]}/><meshStandardMaterial color="#788d65" flatShading/></mesh>
    </group>)}
  </group>;
}

