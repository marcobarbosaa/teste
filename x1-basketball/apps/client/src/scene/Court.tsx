export function Court() {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 80]}/><meshStandardMaterial color="#182c2b"/></mesh>
    <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[15, 14]}/><meshStandardMaterial color="#426c62"/></mesh>
    <gridHelper args={[14, 14, '#b7c2a0', '#577d70']} position={[0, 0.025, 0]}/>
  </group>;
}

