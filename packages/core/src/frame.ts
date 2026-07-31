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
import type { AudioSceneTiming } from './audio';

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
  | {
      type: 'global-start';
      globalStart: number;
      sourceDuration?: number;
      outputDuration?: number;
      timeMap?: AudioSceneTiming['timeMap'];
    };

const SceneLocalFrameContext = createContext<SceneLocalFrameContextValue | null>(null);

export function SceneLocalFrameProvider({
  value,
  globalStart,
  sourceDuration,
  outputDuration,
  timeMap,
  children,
}: {
  value?: number;
  globalStart?: number;
  sourceDuration?: number;
  outputDuration?: number;
  timeMap?: AudioSceneTiming['timeMap'];
  children: ReactNode;
}) {
  const contextValue = useMemo<SceneLocalFrameContextValue>(
    () =>
      typeof globalStart === 'number'
        ? { type: 'global-start', globalStart, sourceDuration, outputDuration, timeMap }
        : { type: 'frame', frame: value ?? 0 },
    [globalStart, outputDuration, sourceDuration, timeMap, value]
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
    return mapSceneOutputFrameToSource(
      Math.max(0, globalFrame - sceneFrame.globalStart),
      sceneFrame.sourceDuration,
      sceneFrame.outputDuration,
      sceneFrame.timeMap,
    );
  }
  return sceneFrame.frame;
}

function interpolateFrame(
  value: number,
  points: Array<{ input: number; output: number }>,
): number {
  if (points.length < 2) return Math.max(0, value);
  if (value <= points[0].input) return points[0].output;
  for (let index = 1; index < points.length; index++) {
    const left = points[index - 1];
    const right = points[index];
    if (value > right.input) continue;
    const span = Math.max(1, right.input - left.input);
    return left.output + ((value - left.input) / span) * (right.output - left.output);
  }
  return points[points.length - 1].output;
}

export function mapSceneOutputFrameToSource(
  outputFrame: number,
  sourceDuration?: number,
  outputDuration?: number,
  timeMap?: AudioSceneTiming['timeMap'],
): number {
  const source = Math.max(1, sourceDuration ?? outputDuration ?? 1);
  const output = Math.max(1, outputDuration ?? sourceDuration ?? 1);
  const anchors = timeMap?.length
    ? timeMap.map((point) => ({ input: point.outputFrame, output: point.sourceFrame }))
    : [{ input: 0, output: 0 }, { input: output, output: source }];
  return Math.max(0, Math.min(source - 1, Math.floor(interpolateFrame(outputFrame, anchors))));
}

export function mapSceneSourceFrameToOutput(
  sourceFrame: number,
  sourceDuration: number,
  outputDuration: number,
  timeMap?: AudioSceneTiming['timeMap'],
): number {
  const anchors = timeMap?.length
    ? timeMap.map((point) => ({ input: point.sourceFrame, output: point.outputFrame }))
    : [{ input: 0, output: 0 }, { input: sourceDuration, output: outputDuration }];
  return Math.max(0, Math.min(outputDuration, Math.round(interpolateFrame(sourceFrame, anchors))));
}

/**
 * Global frame offset of the active <Scene> (0 when not inside one).
 *
 * Animation adapters are flushed with the *global* composition clock, but scene
 * components author timing relative to their scene start. Use this to convert a
 * global frame into a scene-local time, e.g. `tl.seek((frame - globalStart)/fps)`.
 */
export function useSceneGlobalStart(): number {
  const sceneFrame = useContext(SceneLocalFrameContext);
  return sceneFrame?.type === 'global-start' ? sceneFrame.globalStart : 0;
}

/** Map a composition-global frame onto the active scene's authored local clock. */
export function useSceneFrameMapper(): (frame: number) => number {
  const sceneFrame = useContext(SceneLocalFrameContext);
  return useMemo(() => (frame: number) => {
    if (!sceneFrame) return Math.max(0, frame);
    if (sceneFrame.type === 'frame') return sceneFrame.frame;
    return mapSceneOutputFrameToSource(
      Math.max(0, frame - sceneFrame.globalStart),
      sceneFrame.sourceDuration,
      sceneFrame.outputDuration,
      sceneFrame.timeMap,
    );
  }, [sceneFrame]);
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
      return mapSceneOutputFrameToSource(
        Math.max(0, globalFrame - sceneFrame.globalStart),
        sceneFrame.sourceDuration,
        sceneFrame.outputDuration,
        sceneFrame.timeMap,
      );
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
