import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
export function Wire({ segments, color = '#c6d5d1', opacity = 1 }: { segments: number[]; color?: string; opacity?: number }) {
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new Float32BufferAttribute(segments, 3));
    return result;
  }, [segments]);
  return <lineSegments geometry={geometry}><lineBasicMaterial color={color} transparent={opacity < 1} opacity={opacity}/></lineSegments>;
}
export function courtArc(radius: number, from: number, to: number, centerZ: number, width = 0.05) {
  const geometry = new BufferGeometry(), points: number[] = [], indices: number[] = [];
  const steps = Math.max(16, Math.ceil((to - from) * 40));
  for (let i = 0; i <= steps; i++) {
    const theta = from + (to - from) * i / steps;
    for (const r of [radius - width / 2, radius + width / 2]) points.push(Math.sin(theta) * r, 0.037, centerZ + Math.cos(theta) * r);
    if (i < steps) { const k = i * 2; indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

