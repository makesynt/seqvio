/**
 * @seqvio/whiteboard
 *
 * Whiteboard animation components for Seqvio framework.
 * Create VideoScribe-style whiteboard animations with React.
 *
 * The world's first open-source AI-powered whiteboard video framework.
 *
 * @example
 * ```tsx
 * import {
 *   WhiteboardScene,
 *   DrawText,
 *   DrawShape,
 *   Hand
 * } from '@seqvio/whiteboard';
 *
 * export default function MyVideo() {
 *   return (
 *     <WhiteboardScene texture="paper">
 *       <DrawText
 *         text="Hello, World!"
 *         fontSize={72}
 *         position={{ x: 960, y: 540 }}
 *         start={0}
 *         duration={90}
 *       />
 *       <DrawShape
 *         type="arrow"
 *         from={{ x: 400, y: 500 }}
 *         to={{ x: 600, y: 500 }}
 *         start={90}
 *         duration={60}
 *       />
 *       <Hand action="write" follow={true} />
 *     </WhiteboardScene>
 *   );
 * }
 *
 * export const meta = { duration: 180 };
 * ```
 *
 * @packageDocumentation
 */

// Core Components
export { WhiteboardScene } from './components/WhiteboardScene';
export { DrawText } from './components/DrawText';
export { DrawShape } from './components/DrawShape';
export { DrawImage } from './components/DrawImage';
export { Hand } from './components/Hand';

// Hooks
export { useCurrentFrame, useFPS, setGlobalFrame } from './hooks/useCurrentFrame';
export { useDrawAnimationProgress } from './hooks/useDrawAnimationProgress';

// Context
export { DrawRegistryProvider, useDrawRegistry, useOptionalDrawRegistry } from './context/DrawRegistry';
export { SceneLocalFrameProvider } from './context/SceneLocalFrame';

// Theme
export {
  WhiteboardThemeProvider,
  useWhiteboardTheme,
  defaultWhiteboardTheme,
  mergeTheme,
  getTextStrokeWidth,
  excalidrawTheme,
} from './theme';
export type { WhiteboardTheme, TextRenderMode, ShapeFillDefault } from './theme';

// Utilities
export * from './utils/pathUtils';
export * from './utils/animationUtils';
export {
  computeEffectiveStartMap,
  getSerializedSceneEnd,
  sortDrawsBySchedule,
} from './utils/drawTiming';
export {
  splitStrokeWashProgress,
  resolveStrokeHeadProgress,
} from './utils/drawProgress';
export type { StrokeWashSplit } from './utils/drawProgress';
export { getTextRevealMetrics } from './utils/textReveal';
export type { TextBounds as TextRevealBounds, TextRevealClip, TextRevealMetrics } from './utils/textReveal';
export type { DrawTimingInput } from './utils/drawTiming';
export * from './utils/textPath';
export {
  preloadHandwritingFonts,
  preloadFontFace,
  VIRGIL_FAMILY,
  LONGCANG_FAMILY,
  YOZAI_FAMILY,
  XIAOLAI_FAMILY,
  WENKAI_FAMILY,
} from './utils/handwritingFonts';
export { pickHandwritingFontFamily } from './utils/handwritingFontForText';
export {
  textToRoughHandPathSync,
  preloadLongcangOpentype,
  preloadYozaiOpentype,
  preloadXiaolaiOpentype,
  preloadWenkaiOpentype,
} from './utils/textPath';
export { estimateTextBounds, boundsFromSvgTextElement } from './utils/textBounds';
export type { TextBounds } from './utils/textBounds';

// Types
export * from './types';

/**
 * Package version
 */
export const VERSION = '0.1.0';
