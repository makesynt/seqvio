export { TechnicalScene } from './TechnicalScene';
export type { TechnicalSceneProps } from './TechnicalScene';

export {
  AnnotationLayer,
  AnnotationProvider,
  AnnotationTarget,
  useAnnotationTargetRegistry,
} from './AnnotationLayer';
export type {
  AnnotationItem,
  AnnotationKind,
  AnnotationLayerProps,
  AnnotationTargetProps,
  TargetRect,
} from './AnnotationLayer';

export { CodeWalkthrough } from './CodeWalkthrough';
export type { CodeWalkthroughProps } from './CodeWalkthrough';

export { ArchitectureDiagram } from './ArchitectureDiagram';
export type { ArchitectureDiagramProps } from './ArchitectureDiagram';

export { TerminalDemo } from './TerminalDemo';
export type {
  TerminalDemoProps,
  TerminalEvent,
  TerminalEventKind,
  TerminalGridCell,
  TerminalGridSnapshot,
  TerminalStep,
} from './TerminalDemo';

export type {
  TerminalZoomKeyframe,
  TerminalZoomOptions,
  TerminalZoomCamera,
} from './TerminalDemo';
export { resolveTerminalZoomCamera } from './TerminalDemo';

export {
  ansiToSpans,
  applySimpleTerminalRewrites,
  normalizeTerminalNewlines,
  sliceAnsiByVisibleChars,
  sliceAnsiByVisibleLines,
  stripAnsi,
  visibleLength,
  VHS_CATPPUCCIN_MOCHA,
  VHS_DEFAULT,
} from './ansi';
export type { AnsiSpan, AnsiStyle, VhsTheme } from './ansi';

export {
  applyCodeSteps,
  createLineRecords,
  highlightLine,
  highlightLineFallback,
  highlightSource,
  resetLineIdCounter,
  splitSourceLines,
} from './code-utils';
export type {
  CodeLineRecord,
  CodeStep,
  HighlightToken,
  LineRange,
} from './code-utils';

export {
  collapsedGroupsAt,
  diagramVisibility,
  groupProxyId,
  layoutDiagram,
} from './diagram-layout';
export type {
  DiagramEdgeInput,
  DiagramNodeInput,
  DiagramStep,
  LayoutEdge,
  LayoutNode,
} from './diagram-layout';

export { technicalPalette, technicalFonts, technicalCodeTheme } from './theme';
export {
  BUNDLED_CODE_FONT_FAMILY,
  BUNDLED_CODE_FONT_FILE,
  TERMINAL_FONT_FAMILY,
  TERMINAL_FONT_LATIN_FILE,
  TERMINAL_FONT_STACK,
  TERMINAL_FONT_SYMBOLS_FILE,
  PROGRAMMING_MONO_FONTS,
  detectInstalledProgrammingMonoFonts,
  isMonoFontInstalled,
  preloadBundledCodeFont,
  programmingMonoFontStack,
  resolveProgrammingMonoFont,
} from './fonts';
export { CodeFontFaces } from './CodeFontFaces';
export { ease, useReveal, clamp01 } from './anim';
