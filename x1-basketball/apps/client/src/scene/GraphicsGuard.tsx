import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
export function GraphicsGuard({ onFailure }: { onFailure: (error: Error) => void }) {
  const gl = useThree(state => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.dataset.sceneReady = 'true';
    const lost = (event: Event) => { event.preventDefault(); onFailure(new Error('WEBGL_CONTEXT_LOST')); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => { canvas.removeEventListener('webglcontextlost', lost); delete canvas.dataset.sceneReady; };
  }, [gl, onFailure]);
  return null;
}

