/**
 * CompositionDocument v2 — versioned, scene-oriented IR for mixed explainer
 * families (whiteboard, code, diagram, and future technical scenes).
 *
 * Pure data (JSON). Types only — no React or style-package imports.
 */

import type {
  StoryboardDensity,
  StoryboardElement,
  StoryboardLayoutId,
  StoryboardSceneRole,
} from '../storyboard/schema';

export const COMPOSITION_DOCUMENT_VERSION = '2.0' as const;

export type CompositionDocumentVersion = typeof COMPOSITION_DOCUMENT_VERSION;

export type AnnotationKind =
  | 'arrow'
  | 'circle'
  | 'box'
  | 'underline'
  | 'spotlight';

export const ANNOTATION_KINDS: AnnotationKind[] = [
  'arrow',
  'circle',
  'box',
  'underline',
  'spotlight',
];

export interface AddressableElement {
  id: string;
}

export interface AnnotationSpec extends AddressableElement {
  targetId: string;
  kind: AnnotationKind;
  start: number;
  duration: number;
  label?: string;
}

export interface LineRange {
  startLine: number;
  endLine: number;
}

export type CodeStep =
  | { at: number; action: 'type'; range?: LineRange }
  | { at: number; action: 'focus'; range: LineRange }
  | { at: number; action: 'insert'; line: number; text: string }
  | { at: number; action: 'replace'; range: LineRange; text: string }
  | { at: number; action: 'delete'; range: LineRange }
  | { at: number; action: 'annotate'; targetId: string; text: string };

export interface WhiteboardSceneSpec {
  type: 'whiteboard';
  id: string;
  layout?: StoryboardLayoutId;
  sceneRole?: StoryboardSceneRole;
  density?: StoryboardDensity;
  narration?: string;
  duration?: number;
  elements: StoryboardElement[];
  annotations?: AnnotationSpec[];
}

export interface CodeSceneSpec {
  type: 'code';
  id: string;
  language: string;
  source: string;
  steps: CodeStep[];
  narration?: string;
  duration?: number;
  annotations?: AnnotationSpec[];
}

export interface DiagramNode extends AddressableElement {
  label: string;
  groupId?: string;
}

export interface DiagramEdge extends AddressableElement {
  from: string;
  to: string;
  label?: string;
}

export type DiagramStep =
  | { at: number; action: 'reveal'; targetId: string }
  | { at: number; action: 'connect'; edgeId: string }
  | { at: number; action: 'trace'; edgeId: string }
  | { at: number; action: 'emphasize'; targetId: string }
  | { at: number; action: 'collapse'; groupId: string }
  | { at: number; action: 'expand'; groupId: string };

export interface DiagramSceneSpec {
  type: 'diagram';
  id: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  steps: DiagramStep[];
  narration?: string;
  duration?: number;
  annotations?: AnnotationSpec[];
}

/** Grid cell contract mirroring @seqvio/technical's runtime TerminalGridCell. */
export interface TerminalGridCellSpec {
  x: number;
  chars: string;
  width: number;
  foreground?: string;
  background?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
  invisible?: boolean;
  strikethrough?: boolean;
}

/** Terminal viewport snapshot contract mirroring @seqvio/technical's TerminalGridSnapshot. */
export interface TerminalGridSnapshotSpec {
  cols: number;
  rows: number;
  cursorX: number;
  cursorY: number;
  lines: TerminalGridCellSpec[][];
}

/** Placeholder scene families compiled to stub components in Phase A. */
export interface TerminalRenderOptions {
  title?: string;
  presentation?: 'minimal' | 'vhs';
  typingCps?: number;
  zoomOnInput?: boolean;
  maxZoom?: number;
  zoomTransitionMs?: number;
  zoomHoldMs?: number;
}

export interface TerminalSceneSpec {
  type: 'terminal';
  id: string;
  /**
   * Legacy field for placeholder terminal scenes.
   * When only `commands` is provided, renderers may fall back to a simplified view.
   */
  commands?: string[];
  /** Streamed terminal I/O events (typically from terminal-narrator). */
  events?: Array<{
    timeMs: number;
    kind: 'stdin' | 'stdout' | 'stderr';
    text: string;
    /** Complete terminal viewport; replaces earlier persistent output. */
    snapshot?: boolean;
    /**
     * If true, the event is shown only transiently while typed and does not
     * persist in the scrollback. stdin events default to transient.
     */
    transient?: boolean;
    /** Pre-rendered terminal viewport snapshot from a terminal emulator. */
    grid?: TerminalGridSnapshotSpec;
    /** Raw ANSI escape-sequence bytes that produced this event. */
    raw?: string;
  }>;
  /** Step boundaries used for highlighting and narration segmentation. */
  steps?: Array<{
    id: string;
    label: string;
    timeMs: number;
  }>;
  cols?: number;
  rows?: number;
  maxLines?: number;
  renderOptions?: TerminalRenderOptions;
  narration?: string;
  duration?: number;
  annotations?: AnnotationSpec[];
}

/** Timed point for cursor/click tracking in browser capture scenes. */
export interface TimedPoint {
  timeMs: number;
  x: number;
  y: number;
}

/** Focus target for zoom-to-element in browser capture scenes. */
export interface RecordedFocusTarget extends TimedPoint {
  width: number;
  height: number;
  reset?: boolean;
}

/** Browser screen-recording scene (from @seqvio/browser-recorder via capture). */
export interface BrowserSceneSpec {
  type: 'browser';
  id: string;
  sourceVideo: string;
  cursorPoints?: TimedPoint[];
  focusTargets?: RecordedFocusTarget[];
  clicks?: TimedPoint[];
  recordingWidth?: number;
  recordingHeight?: number;
  maxZoom?: number;
  narration?: string;
  duration?: number;
  annotations?: AnnotationSpec[];
}

export type SceneSpec =
  | WhiteboardSceneSpec
  | CodeSceneSpec
  | DiagramSceneSpec
  | TerminalSceneSpec
  | BrowserSceneSpec;

export const SCENE_TYPES = [
  'whiteboard',
  'code',
  'diagram',
  'terminal',
  'browser',
] as const;

export type SceneType = (typeof SCENE_TYPES)[number];

export interface ChapterSpec {
  id: string;
  title?: string;
  /** Scene ids grouped into this chapter for render planning. */
  sceneIds: string[];
}

export interface CompositionDocument {
  version: CompositionDocumentVersion;
  id: string;
  width?: number;
  height?: number;
  fps?: number;
  backgroundColor?: string;
  lockToAudio?: boolean;
  transitionDuration?: number;
  /** Versioned pacing policy used by authoring, timing resolution, and QA. */
  pacingProfile?: string;
  chapters?: ChapterSpec[];
  scenes: SceneSpec[];
  /** Document-level annotations that may target any scene element id. */
  annotations?: AnnotationSpec[];
}

export const COMPOSITION_DOCUMENT_DEFAULTS = {
  width: 1280,
  height: 720,
  fps: 30,
  backgroundColor: '#ffffff',
  lockToAudio: true,
  transitionDuration: 12,
  pacingProfile: 'explainer-v1',
};

/** Render-plan contracts (Phase A schema; resume implementation follows in renderer). */

export type ChapterRenderStatus = 'pending' | 'complete' | 'failed';

export interface ChapterRenderPlanEntry {
  id: string;
  startFrame: number;
  endFrame: number;
  contentHash?: string;
  settingsHash?: string;
  narrationManifestPath?: string;
  captionManifestPath?: string;
  outputPath?: string;
  status?: ChapterRenderStatus;
  previewComplete?: boolean;
  finalComplete?: boolean;
  diagnostics?: string[];
}

export interface RenderPlanManifest {
  compositionId: string;
  rendererVersion?: string;
  settingsHash?: string;
  chapters: ChapterRenderPlanEntry[];
}
