/**
 * Seqvio Whiteboard - Type Definitions
 *
 * Core TypeScript types for whiteboard animation system.
 * All components use these types for props and configuration.
 *
 * @packageDocumentation
 */

/**
 * Configuration for WhiteboardScene component
 *
 * @example
 * ```tsx
 * const config: WhiteboardConfig = {
 *   background: '#ffffff',
 *   texture: 'paper',
 *   showHand: true,
 *   handStyle: 'realistic',
 *   strokeColor: '#2c3e50'
 * };
 * ```
 */
export interface WhiteboardConfig {
  background?: string;
  texture?: 'paper' | 'whiteboard' | 'chalkboard' | 'none';
  showHand?: boolean;
  /** @deprecated Only pen-tip cursor is rendered; kept for API compatibility. */
  handStyle?: 'realistic' | 'cartoon' | 'minimal';
  strokeColor?: string;
  strokeWidth?: number;
}

export interface DrawOptions {
  start?: number;
  duration: number;
  delay?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  fillDelay?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PathInfo {
  path: string;
  length: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type HandAction = 'write' | 'draw' | 'point' | 'erase' | 'idle';

export interface HandProps {
  position?: Point;
  action?: HandAction;
  /** Pen-tip only; `realistic` / `cartoon` are aliases of `minimal`. */
  style?: 'realistic' | 'cartoon' | 'minimal';
  follow?: boolean;
  visible?: boolean;
  rotation?: number;
  /** Override theme pen tip size in CSS pixels. */
  size?: number;
}

export type TextRenderMode = 'fill' | 'stroke' | 'stroke-wash';

export interface DrawTextProps extends DrawOptions {
  text: string;
  font?: string;
  fontSize?: number;
  fontWeight?: number | string;
  position?: Point;
  align?: 'left' | 'center' | 'right';
  textRender?: TextRenderMode;
}

export interface DrawShapeProps extends DrawOptions {
  type:
    | 'circle'
    | 'rectangle'
    | 'rounded-rectangle'
    | 'arrow'
    | 'line'
    | 'underline'
    | 'star';
  position?: Point;
  size?: number | { width: number; height: number };
  from?: Point;
  to?: Point;
  roughness?: number;
  borderRadius?: number;
}

export interface DrawImageProps extends DrawOptions {
  src: string;
  position?: Point;
  size?: { width: number; height: number };
  traceMode?: 'outline' | 'full' | 'edges';
}

export type DrawElement = {
  id: string;
  type: 'text' | 'shape' | 'image' | 'path';
  props: DrawTextProps | DrawShapeProps | DrawImageProps | any;
  startFrame: number;
  endFrame: number;
};
