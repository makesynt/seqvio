/**
 * useCurrentFrame Hook
 */

import { useEffect, useState } from 'react';
import { useSceneLocalFrame } from '../context/SceneLocalFrame';

let globalFrame = 0;
let frameListeners: Set<(frame: number) => void> = new Set();

export function setGlobalFrame(frame: number) {
  globalFrame = frame;
  frameListeners.forEach((listener) => listener(frame));
}

export function useCurrentFrame(): number {
  const sceneLocalFrame = useSceneLocalFrame();
  const [frame, setFrame] = useState(globalFrame);

  useEffect(() => {
    frameListeners.add(setFrame);
    return () => {
      frameListeners.delete(setFrame);
    };
  }, []);

  if (sceneLocalFrame !== null) {
    return sceneLocalFrame;
  }

  return frame;
}

export function useFPS(): number {
  return 30;
}
