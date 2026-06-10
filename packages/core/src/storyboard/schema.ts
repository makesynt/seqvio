/**
 * Storyboard IR — the structured intermediate representation that sits between
 * content (a prompt / document, eventually produced by an LLM) and a renderable
 * TSX composition.
 *
 * Design goals:
 * - Fields map 1:1 onto existing component props (DrawText / DrawShape /
 *   DrawImage / Hand) so compilation is mechanical and unambiguous.
 * - Pure data (JSON). An LLM fills this table; it never writes executable code.
 *   The IR is validated against this shape before compilation (see validate.ts).
 * - Style-agnostic at the top level: `style` selects which style package the
 *   compiler targets (whiteboard today; presentation/etc. later).
 *
 * This module is types + constants only — no React, no whiteboard import — so
 * @seqvio/core stays free of any style package.
 */

export type StoryboardStyle = 'whiteboard';

export type ElementAlign = 'left' | 'center' | 'right';

export type ElementEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

interface BaseElement {
  /** Frame (relative to its scene) at which the element starts drawing. */
  start?: number;
  /** Number of frames the draw animation takes. */
  duration?: number;
  easing?: ElementEasing;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  position: Vec2;
  fontSize?: number;
  fontWeight?: number | string;
  align?: ElementAlign;
}

export type ShapeKind =
  | 'circle'
  | 'rectangle'
  | 'rounded-rectangle'
  | 'arrow'
  | 'line'
  | 'underline'
  | 'star';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeKind;
  /** For box shapes (circle/rectangle/...). */
  position?: Vec2;
  size?: number | Size;
  /** For directional shapes (arrow/line/underline). */
  from?: Vec2;
  to?: Vec2;
  borderRadius?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  position?: Vec2;
  size?: Size;
}

export type StoryboardElement = TextElement | ShapeElement | ImageElement;

export const ELEMENT_TYPES = ['text', 'shape', 'image'] as const;

export const SHAPE_KINDS: ShapeKind[] = [
  'circle',
  'rectangle',
  'rounded-rectangle',
  'arrow',
  'line',
  'underline',
  'star',
];

export interface StoryboardScene {
  id: string;
  /** Narration spoken over this scene. Compiled into the audio manifest. */
  narration?: string;
  /** Optional explicit scene length in frames (otherwise driven by audio/elements). */
  duration?: number;
  elements: StoryboardElement[];
}

export interface StoryboardTransition {
  /** Cross-fade duration in frames inserted after the preceding scene. */
  duration?: number;
}

export interface Storyboard {
  /** Identifier used for the generated composition. */
  id: string;
  style?: StoryboardStyle;
  width?: number;
  height?: number;
  fps?: number;
  backgroundColor?: string;
  /** Texture passed to the whiteboard scene background. */
  texture?: 'paper' | 'whiteboard' | 'chalkboard' | 'none';
  /** When true, total duration locks to the synthesized narration length. */
  lockToAudio?: boolean;
  /** Fade duration (frames) inserted between consecutive scenes. 0 disables. */
  transitionDuration?: number;
  scenes: StoryboardScene[];
}

export const STORYBOARD_DEFAULTS = {
  style: 'whiteboard' as StoryboardStyle,
  width: 1280,
  height: 720,
  fps: 30,
  backgroundColor: '#ffffff',
  texture: 'whiteboard' as const,
  lockToAudio: true,
  transitionDuration: 12,
};
