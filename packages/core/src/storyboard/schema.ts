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
 * - Whiteboard-only: the IR maps to @seqvio/whiteboard components so the
 *   compile step stays mechanical and predictable.
 *
 * This module is types + constants only — no React, no whiteboard import — so
 * @seqvio/core stays free of any style package.
 */

export type StoryboardStyle = 'whiteboard';

export type {
  StoryboardDensity,
  StoryboardLayoutId,
  StoryboardSceneRole,
} from './layout-registry';

import type {
  StoryboardDensity,
  StoryboardLayoutId,
  StoryboardSceneRole,
} from './layout-registry';

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

export interface IconElement extends BaseElement {
  type: 'icon';
  /** Built-in icon name (see @seqvio/whiteboard ICON_NAMES). */
  name: string;
  position: Vec2;
  /** Square size in pixels. */
  size?: number;
}

export type StoryboardElement =
  | TextElement
  | ShapeElement
  | ImageElement
  | IconElement;

export const ELEMENT_TYPES = ['text', 'shape', 'image', 'icon'] as const;

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
  /** Registered layout recipe used for validation and future auto-layout. */
  layout?: StoryboardLayoutId;
  /** Narrative role within the video arc. */
  sceneRole?: StoryboardSceneRole;
  /** Local density override. Defaults to the board-level density. */
  density?: StoryboardDensity;
  /** Narration spoken over this scene. Compiled into the audio manifest. */
  narration?: string;
  /** Optional explicit scene length in frames (otherwise driven by audio/elements). */
  duration?: number;
  /** Whiteboard drawable elements. */
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
  /** Concrete visual preset id, for example "whiteboard/field-note". */
  styleId?: string;
  audience?: string;
  density?: StoryboardDensity;
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
  styleId: 'whiteboard/default',
  density: 'speaker-led' as StoryboardDensity,
  width: 1280,
  height: 720,
  fps: 30,
  backgroundColor: '#ffffff',
  texture: 'whiteboard' as const,
  lockToAudio: true,
  transitionDuration: 12,
};
