/**
 * ExplainerDocument — scene-oriented execution IR for mixed explainer
 * families (whiteboard, code, diagram, and future technical scenes).
 *
 * Pure data (JSON). Types only — no React or style-package imports.
 */

import type {
  StoryboardDensity,
  StoryboardElement,
  StoryboardLayoutId,
  StoryboardSceneRole,
} from "../storyboard/schema";
import type { SoundCueSpec } from "../sound";
export { SCENE_TYPES, type SceneType } from "./capabilities";

export const EXPLAINER_DOCUMENT_FORMAT = "seqvio-explainer" as const;
export const EXPLAINER_DOCUMENT_SCHEMA_VERSION = "1.0" as const;

export type ExplainerDocumentSchemaVersion =
  typeof EXPLAINER_DOCUMENT_SCHEMA_VERSION;

export type AnnotationKind =
  | "arrow"
  | "circle"
  | "box"
  | "underline"
  | "spotlight"
  | "focus-ring"
  | "callout"
  | "bracket"
  | "connector"
  | "region-shade"
  | "guided-path";

export const ANNOTATION_KINDS: AnnotationKind[] = [
  "arrow",
  "circle",
  "box",
  "underline",
  "spotlight",
  "focus-ring",
  "callout",
  "bracket",
  "connector",
  "region-shade",
  "guided-path",
];

export interface AddressableElement {
  id: string;
}

export type VisualBeatActionKind =
  | "reveal"
  | "highlight"
  | "focus"
  | "annotate"
  | "compare"
  | "trace"
  | "emphasize"
  | "transform";

export interface ExplanationCueSpec {
  id: string;
  text: string;
  voice?: string;
}

export interface ExplanationBeatAnchorSpec {
  /** Exact phrase in the referenced cue after language-tag/whitespace normalization. */
  text: string;
  /** One-based match number when the phrase occurs more than once. */
  occurrence?: number;
}

export interface VisualBeatAction {
  targetId: string;
  action: VisualBeatActionKind;
  relatedTargetId?: string;
  pathTargetIds?: string[];
  /** Negative values reveal before speech; positive values delay the action. */
  offsetMs?: number;
  minHoldMs?: number;
}

export interface ExplanationBeatSpec extends AddressableElement {
  cueId: string;
  anchor: ExplanationBeatAnchorSpec;
  visuals: VisualBeatAction[];
  sounds?: SoundCueSpec[];
  evidence?: {
    captureStepId?: string;
  };
}

export interface SceneExplanationSpec {
  cues: ExplanationCueSpec[];
  beats: ExplanationBeatSpec[];
}

export interface AnnotationSpec extends AddressableElement {
  targetId: string;
  toTargetId?: string;
  pathTargetIds?: string[];
  kind: AnnotationKind;
  start: number;
  duration: number;
  label?: string;
  priority?: number;
}

export interface LineRange {
  startLine: number;
  endLine: number;
}

export type CodeStep = {
  /** Stable authoring target for ExplanationBeat timing. */
  id?: string;
} & (
  | { at: number; action: "type"; range?: LineRange }
  | { at: number; action: "focus"; range: LineRange }
  | { at: number; action: "insert"; line: number; text: string }
  | { at: number; action: "replace"; range: LineRange; text: string }
  | { at: number; action: "delete"; range: LineRange }
  | { at: number; action: "annotate"; targetId: string; text: string }
);

export interface WhiteboardSceneSpec {
  type: "whiteboard";
  id: string;
  layout?: StoryboardLayoutId;
  sceneRole?: StoryboardSceneRole;
  density?: StoryboardDensity;
  narration?: string;
  explanation?: SceneExplanationSpec;
  duration?: number;
  elements: StoryboardElement[];
  annotations?: AnnotationSpec[];
}

export interface CodeSceneSpec {
  type: "code";
  id: string;
  language: string;
  source: string;
  steps: CodeStep[];
  narration?: string;
  explanation?: SceneExplanationSpec;
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

export type DiagramStep = {
  /** Stable authoring target for ExplanationBeat timing. */
  id?: string;
} & (
  | { at: number; action: "reveal"; targetId: string }
  | { at: number; action: "connect"; edgeId: string }
  | { at: number; action: "trace"; edgeId: string }
  | { at: number; action: "emphasize"; targetId: string }
  | { at: number; action: "collapse"; groupId: string }
  | { at: number; action: "expand"; groupId: string }
);

export interface DiagramSceneSpec {
  type: "diagram";
  id: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  steps: DiagramStep[];
  narration?: string;
  explanation?: SceneExplanationSpec;
  duration?: number;
  annotations?: AnnotationSpec[];
}

export interface InfographicMetricSpec extends AddressableElement {
  label: string;
  value: string;
  detail?: string;
  color?: string;
  at?: number;
}

export interface InfographicComparisonSpec extends AddressableElement {
  label: string;
  before: number;
  after: number;
  beforeLabel?: string;
  afterLabel?: string;
  at?: number;
}

export interface InfographicProcessStepSpec extends AddressableElement {
  label: string;
  detail?: string;
  at?: number;
}

export interface InfographicTimelineEventSpec extends AddressableElement {
  label: string;
  detail?: string;
  at?: number;
}

export interface InfographicRelationshipNodeSpec extends AddressableElement {
  label: string;
  x: number;
  y: number;
}

export interface InfographicRelationshipSpec extends AddressableElement {
  from: string;
  to: string;
  label?: string;
  at?: number;
}

export interface InfographicChartPointSpec {
  x: string;
  y: number;
}

export interface InfographicChartSeriesSpec extends AddressableElement {
  label: string;
  color?: string;
  points: InfographicChartPointSpec[];
}

export interface InfographicChartAxisSpec {
  label?: string;
  min?: number;
  max?: number;
  ticks?: number;
}

export interface InfographicChartSpec extends AddressableElement {
  title: string;
  kind: "bar" | "line";
  series: InfographicChartSeriesSpec[];
  xAxis?: InfographicChartAxisSpec;
  yAxis?: InfographicChartAxisSpec;
  legend?: "none" | "top" | "bottom";
  unit?: string;
  sourceLabel?: string;
  at?: number;
}

export interface AttentionSequenceSpec extends AddressableElement {
  sceneId?: string;
  targetId: string;
  toTargetId?: string;
  pathTargetIds?: string[];
  kind: AnnotationKind;
  start: number;
  duration: number;
  label?: string;
  handoffTo?: string;
  minHoldFrames?: number;
  sourceBeatId?: string;
  persistence?: "timed" | "until-handoff" | "until-clear";
  clearAt?: number;
  handoffToSceneId?: string;
  priority?: number;
}

export interface InfographicSceneSpec {
  type: "infographic";
  id: string;
  title?: string;
  density?: "auto" | "standard" | "reduced";
  metrics?: InfographicMetricSpec[];
  comparisons?: InfographicComparisonSpec[];
  process?: InfographicProcessStepSpec[];
  timeline?: InfographicTimelineEventSpec[];
  relationshipNodes?: InfographicRelationshipNodeSpec[];
  relationships?: InfographicRelationshipSpec[];
  charts?: InfographicChartSpec[];
  attention?: AttentionSequenceSpec[];
  narration?: string;
  explanation?: SceneExplanationSpec;
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
  presentation?: "minimal" | "vhs";
  typingCps?: number;
  cursorBlink?: boolean;
  zoomOnInput?: boolean;
  maxZoom?: number;
  zoomTransitionMs?: number;
  zoomHoldMs?: number;
}

export interface TerminalSceneSpec {
  type: "terminal";
  id: string;
  /**
   * Legacy field for placeholder terminal scenes.
   * When only `commands` is provided, renderers may fall back to a simplified view.
   */
  commands?: string[];
  /** Streamed terminal I/O events (typically from terminal-narrator). */
  events?: Array<{
    timeMs: number;
    kind: "stdin" | "stdout" | "stderr";
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
  explanation?: SceneExplanationSpec;
  duration?: number;
  annotations?: AnnotationSpec[];
}

/** Timed point for cursor/click tracking in browser capture scenes. */
export interface TimedPoint {
  /** Optional capture action id that produced this point. */
  id?: string;
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
  type: "browser";
  id: string;
  sourceVideo: string;
  cursorPoints?: TimedPoint[];
  focusTargets?: RecordedFocusTarget[];
  clicks?: TimedPoint[];
  /** Recorded action boundaries used as evidence for explanation timing. */
  steps?: Array<{
    id: string;
    label: string;
    timeMs: number;
  }>;
  recordingWidth?: number;
  recordingHeight?: number;
  maxZoom?: number;
  narration?: string;
  explanation?: SceneExplanationSpec;
  duration?: number;
  annotations?: AnnotationSpec[];
}

export interface ManimMarkerSpec extends AddressableElement {
  frame: number;
  targetId?: string;
  beatId?: string;
}

/** Pre-rendered mathematical animation produced by @seqvio/manim-adapter. */
export interface ManimSceneSpec {
  type: "manim";
  id: string;
  sourceVideo: string;
  sourceManifest?: string;
  markers?: ManimMarkerSpec[];
  mediaWidth?: number;
  mediaHeight?: number;
  mediaFps?: number;
  fit?: "contain" | "cover" | "fill";
  narration?: string;
  explanation?: SceneExplanationSpec;
  duration?: number;
  annotations?: AnnotationSpec[];
}

export type SceneSpec =
  | WhiteboardSceneSpec
  | CodeSceneSpec
  | DiagramSceneSpec
  | InfographicSceneSpec
  | TerminalSceneSpec
  | BrowserSceneSpec
  | ManimSceneSpec;

export interface ChapterSpec {
  id: string;
  title?: string;
  /** Scene ids grouped into this chapter for render planning. */
  sceneIds: string[];
}

export interface ExplainerDocument {
  format: typeof EXPLAINER_DOCUMENT_FORMAT;
  schemaVersion: ExplainerDocumentSchemaVersion;
  id: string;
  width?: number;
  height?: number;
  fps?: number;
  backgroundColor?: string;
  lockToAudio?: boolean;
  transitionDuration?: number;
  /** Versioned pacing policy used by authoring, timing resolution, and QA. */
  pacingProfile?: string;
  /** Optional visual profile; semantic ids, evidence, and timing remain unchanged. */
  styleProfile?: import("../style-profile").StyleProfile;
  chapters?: ChapterSpec[];
  scenes: SceneSpec[];
  /** Document-level annotations that may target any scene element id. */
  annotations?: AnnotationSpec[];
}

export const EXPLAINER_DOCUMENT_DEFAULTS = {
  width: 1280,
  height: 720,
  fps: 30,
  backgroundColor: "#ffffff",
  lockToAudio: true,
  transitionDuration: 12,
  pacingProfile: "explainer-v1",
};

/** Render-plan contracts (Phase A schema; resume implementation follows in renderer). */

export type ChapterRenderStatus = "pending" | "complete" | "failed";

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
