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
  | { at: number; action: 'emphasize'; targetId: string };

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

/** Placeholder scene families compiled to stub components in Phase A. */
export interface TerminalSceneSpec {
  type: 'terminal';
  id: string;
  commands: string[];
  narration?: string;
  duration?: number;
  annotations?: AnnotationSpec[];
}

export interface ChatSceneSpec {
  type: 'chat';
  id: string;
  messages: Array<{ role: 'user' | 'assistant' | 'tool' | 'system'; text: string }>;
  narration?: string;
  duration?: number;
  annotations?: AnnotationSpec[];
}

export interface DiffSceneSpec {
  type: 'diff';
  id: string;
  before: string;
  after: string;
  narration?: string;
  duration?: number;
  annotations?: AnnotationSpec[];
}

export interface InfographicSceneSpec {
  type: 'infographic';
  id: string;
  panels: Array<{ id: string; label: string; value?: string }>;
  narration?: string;
  duration?: number;
  annotations?: AnnotationSpec[];
}

export type SceneSpec =
  | WhiteboardSceneSpec
  | CodeSceneSpec
  | DiagramSceneSpec
  | TerminalSceneSpec
  | ChatSceneSpec
  | DiffSceneSpec
  | InfographicSceneSpec;

export const SCENE_TYPES = [
  'whiteboard',
  'code',
  'diagram',
  'terminal',
  'chat',
  'diff',
  'infographic',
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
