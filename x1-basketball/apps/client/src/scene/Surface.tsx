import { useMemo, useEffect } from 'react';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
export function useSurfaceTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    let seed = 143;
    const data = ctx.createImageData(128, 128);
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      const shade = 225 + ((seed >>> 24) % 26);
      data.data[i] = data.data[i + 1] = data.data[i + 2] = shade; data.data[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    const result = new CanvasTexture(canvas);
    result.wrapS = result.wrapT = RepeatWrapping; result.repeat.set(8, 8); result.colorSpace = SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

