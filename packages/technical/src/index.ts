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
export { ease, useReveal, clamp01 } from './anim';
