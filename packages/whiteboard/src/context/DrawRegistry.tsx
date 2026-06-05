/**

 * DrawRegistry – tracks active drawing paths for Hand follow and timing.

 */



import React, {

  createContext,

  useCallback,

  useContext,

  useMemo,

  useRef,

} from 'react';

import { Point } from '../types';

import { calculateProgress } from '../utils/animationUtils';

import {

  computeEffectiveStartMap,

  DrawTimingInput,

} from '../utils/drawTiming';



export interface RegisteredDraw {

  id: string;

  start: number;

  duration: number;

  /** Must match the drawable's stroke easing (e.g. ease-out). */

  easing: string;

  /** Stroke width used for pen cap alignment. */

  strokeWidth: number;

  order: number;

  pathElement: SVGPathElement | null;

  getPointAtProgress: (progress: number) => Point;

  getAngleAtProgress: (progress: number) => number;

  /**
   * When set, timeline tail is wash-only; pen follows stroke portion (see splitStrokeWashProgress).
   */
  washTailFraction?: number;

  /**
   * When false, pen uses getPointAtProgress (e.g. text clip reveal) instead of path arc length.
   */
  followPath?: boolean;

}



interface DrawRegistryContextValue {

  registerDraw: (draw: Omit<RegisteredDraw, 'order'>) => void;

  unregisterDraw: (id: string) => void;

  updateDrawPath: (id: string, pathElement: SVGPathElement | null) => void;

  /** Authored start, or serialized start when singlePen is enabled. */

  getEffectiveStart: (id: string, fallbackStart: number) => number;

  getActiveDrawAtFrame: (frame: number) => RegisteredDraw | null;

}



const DrawRegistryContext = createContext<DrawRegistryContextValue | null>(null);



let drawOrderCounter = 0;



export function DrawRegistryProvider({

  children,

  singlePen = true,

}: {

  children: React.ReactNode;

  /** When true (default), only one stroke animates at a time per scene. */

  singlePen?: boolean;

}) {

  const drawsRef = useRef<Map<string, RegisteredDraw>>(new Map());

  const singlePenRef = useRef(singlePen);

  singlePenRef.current = singlePen;



  const getTimingInputs = useCallback((): DrawTimingInput[] => {

    return Array.from(drawsRef.current.values()).map((draw) => ({

      id: draw.id,

      start: draw.start,

      duration: draw.duration,

      order: draw.order,

    }));

  }, []);



  const getEffectiveStartMap = useCallback(() => {

    return computeEffectiveStartMap(

      getTimingInputs(),

      singlePenRef.current

    );

  }, [getTimingInputs]);



  const registerDraw = useCallback((draw: Omit<RegisteredDraw, 'order'>) => {

    drawsRef.current.set(draw.id, {

      ...draw,

      order: drawOrderCounter++,

    });

  }, []);



  const unregisterDraw = useCallback((id: string) => {

    drawsRef.current.delete(id);

  }, []);



  const updateDrawPath = useCallback(

    (id: string, pathElement: SVGPathElement | null) => {

      const existing = drawsRef.current.get(id);

      if (existing) {

        drawsRef.current.set(id, { ...existing, pathElement });

      }

    },

    []

  );



  const getEffectiveStart = useCallback((id: string, fallbackStart: number): number => {

    const draw = drawsRef.current.get(id);

    if (!draw) return fallbackStart;

    if (!singlePenRef.current) return draw.start;

    const map = getEffectiveStartMap();

    return map.get(id) ?? draw.start;

  }, [getEffectiveStartMap]);



  const getActiveDrawAtFrame = useCallback((frame: number): RegisteredDraw | null => {

    const effectiveStarts = getEffectiveStartMap();

    const stillDrawing = Array.from(drawsRef.current.values()).filter((draw) => {

      const effectiveStart = effectiveStarts.get(draw.id) ?? draw.start;

      if (frame < effectiveStart || frame >= effectiveStart + draw.duration) {

        return false;

      }

      const progress = calculateProgress(

        frame,

        effectiveStart,

        draw.duration,

        draw.easing

      );

      return progress < 1;

    });



    if (stillDrawing.length === 0) return null;



    stillDrawing.sort((a, b) => {

      const sa = effectiveStarts.get(a.id) ?? a.start;

      const sb = effectiveStarts.get(b.id) ?? b.start;

      if (sa !== sb) return sa - sb;

      return a.order - b.order;

    });



    return stillDrawing[0];

  }, [getEffectiveStartMap]);



  const value = useMemo(

    () => ({

      registerDraw,

      unregisterDraw,

      updateDrawPath,

      getEffectiveStart,

      getActiveDrawAtFrame,

    }),

    [registerDraw, unregisterDraw, updateDrawPath, getEffectiveStart, getActiveDrawAtFrame]

  );



  return (

    <DrawRegistryContext.Provider value={value}>

      {children}

    </DrawRegistryContext.Provider>

  );

}



export function useDrawRegistry(): DrawRegistryContextValue {

  const context = useContext(DrawRegistryContext);

  if (!context) {

    throw new Error('useDrawRegistry must be used within DrawRegistryProvider');

  }

  return context;

}



export function useOptionalDrawRegistry(): DrawRegistryContextValue | null {

  return useContext(DrawRegistryContext);

}



export function getPointOnPath(pathElement: SVGPathElement, progress: number): Point {

  const length = pathElement.getTotalLength();

  const point = pathElement.getPointAtLength(length * Math.max(0, Math.min(1, progress)));

  return { x: point.x, y: point.y };

}



export function getAngleOnPath(pathElement: SVGPathElement, progress: number): number {

  const length = pathElement.getTotalLength();

  const t = Math.max(0, Math.min(1, progress));

  const delta = Math.max(1, length * 0.01);

  const p1 = pathElement.getPointAtLength(length * t);

  const p2 = pathElement.getPointAtLength(Math.min(length, length * t + delta));

  return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;

}


