/**
 * Style-agnostic frame infrastructure.
 *
 * This is the single source of truth for "what frame are we on" during render
 * and preview. It lives in core (not in a style package) so that the renderer
 * and every style package depend on core for frame state — never the reverse.
 *
 * - Global frame: a module-level value pushed by the render runtime each frame
 *   via setGlobalFrame(). Components subscribe through useCurrentFrame().
 * - Scene-local frame: when a multi-scene <Scene> is active it provides a
 *   frame rebased to the scene start, so drawables author timing from 0.
 * - FPS: provided by <VideoComposition>; defaults to 30 for standalone scenes.
 */

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ */
/* Global frame                                                        */
/* ------------------------------------------------------------------ */

let globalFrame = 0;
const frameListeners = new Set<(frame: number) => void>();

/** Push the current frame to all subscribed components. Called by the runtime. */
export function setGlobalFrame(frame: number): void {
  globalFrame = frame;
  frameListeners.forEach((listener) => listener(frame));
}

/** Read the current global frame without subscribing (non-reactive). */
export function getGlobalFrame(): number {
  return globalFrame;
}

/* ------------------------------------------------------------------ */
/* Scene-local frame                                                   */
/* ------------------------------------------------------------------ */

const SceneLocalFrameContext = createContext<number | null>(null);

export function SceneLocalFrameProvider({
  value,
  children,
}: {
  value: number;
  children: ReactNode;
}) {
  return createElement(
    SceneLocalFrameContext.Provider,
    { value },
    children
  );
}

export function useSceneLocalFrame(): number | null {
  return useContext(SceneLocalFrameContext);
}

/* ------------------------------------------------------------------ */
/* FPS                                                                 */
/* ------------------------------------------------------------------ */

const FpsContext = createContext<number>(30);

export function FpsProvider({
  value,
  children,
}: {
  value: number;
  children: ReactNode;
}) {
  return createElement(FpsContext.Provider, { value }, children);
}

/** Frames per second for the active composition (30 when standalone). */
export function useFPS(): number {
  return useContext(FpsContext);
}

/* ------------------------------------------------------------------ */
/* useCurrentFrame                                                     */
/* ------------------------------------------------------------------ */

/**
 * Current frame for the calling component. Returns the scene-local frame when
 * inside an active <Scene>, otherwise the global composition frame.
 */
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
