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
  useMemo,
  useRef,
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

export function subscribeGlobalFrame(listener: (frame: number) => void): () => void {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
}

/* ------------------------------------------------------------------ */
/* Scene-local frame                                                   */
/* ------------------------------------------------------------------ */

type SceneLocalFrameContextValue =
  | { type: 'frame'; frame: number }
  | { type: 'global-start'; globalStart: number };

const SceneLocalFrameContext = createContext<SceneLocalFrameContextValue | null>(null);

export function SceneLocalFrameProvider({
  value,
  globalStart,
  children,
}: {
  value?: number;
  globalStart?: number;
  children: ReactNode;
}) {
  const contextValue = useMemo<SceneLocalFrameContextValue>(
    () =>
      typeof globalStart === 'number'
        ? { type: 'global-start', globalStart }
        : { type: 'frame', frame: value ?? 0 },
    [globalStart, value]
  );
  return createElement(
    SceneLocalFrameContext.Provider,
    { value: contextValue },
    children
  );
}

export function useSceneLocalFrame(): number | null {
  const sceneFrame = useContext(SceneLocalFrameContext);
  if (!sceneFrame) return null;
  if (sceneFrame.type === 'global-start') {
    return Math.max(0, globalFrame - sceneFrame.globalStart);
  }
  return sceneFrame.frame;
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
  return useFrameValue((frame) => frame);
}

/**
 * Subscribe to the current frame through a selector, re-rendering only when the
 * selected value changes (per `isEqual`). This keeps whiteboard draw components
 * from re-rendering every frame when their derived value (e.g. animation
 * progress) is unchanged.
 *
 * Subscription contract:
 * - For `global-start` scenes and the global composition, the component
 *   subscribes to global frame updates and re-evaluates the selector each frame.
 * - For `frame`-type scenes (a fixed, pre-resolved scene-local frame), the value
 *   never changes after mount, so no subscription is created — the selector is
 *   evaluated once.
 *
 * `selector` and `isEqual` are part of the effect dependencies, so callers MUST
 * pass stable (memoized) references — otherwise the subscription is torn down
 * and re-created on every render. See `useDrawAnimationProgress` for the
 * expected `useCallback` usage.
 */
export function useFrameValue<T>(
  selector: (frame: number) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const sceneFrame = useContext(SceneLocalFrameContext);
  const getFrame = () => {
    if (!sceneFrame) return globalFrame;
    if (sceneFrame.type === 'global-start') {
      return Math.max(0, globalFrame - sceneFrame.globalStart);
    }
    return sceneFrame.frame;
  };
  const [value, setValue] = useState(() => selector(getFrame()));
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const update = () => {
      const next = selector(getFrame());
      if (!isEqual(valueRef.current, next)) {
        valueRef.current = next;
        setValue(next);
      }
    };
    update();

    // A fixed scene-local frame never advances, so there is nothing to subscribe
    // to — the single update() above already captured the final value.
    if (sceneFrame?.type === 'frame') {
      return undefined;
    }

    return subscribeGlobalFrame(update);
  }, [sceneFrame, selector, isEqual]);

  return value;
}
