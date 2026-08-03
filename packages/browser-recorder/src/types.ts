export type BrowserActionType =
  | 'click'
  | 'fill'
  | 'scroll'
  | 'wait'
  | 'navigate'
  | 'press';

export interface BrowserAction {
  id: string;
  type: BrowserActionType;
  label: string;
  selector?: string;
  value?: string;
  key?: string;
  x?: number;
  y?: number;
  durationMs?: number;
  afterMs?: number;
  focus?: boolean;
}

export interface BrowserRecordingPlan {
  version: '1.0';
  name: string;
  startUrl: string;
  viewport: { width: number; height: number };
  captureFps?: number;
  renderFps?: number;
  maxZoom?: number;
  actions: BrowserAction[];
}

export interface TimedPoint {
  id?: string;
  timeMs: number;
  x: number;
  y: number;
}

export interface RecordedFocusTarget extends TimedPoint {
  width: number;
  height: number;
  reset?: boolean;
}

export interface RecordingManifest {
  version: '1.0';
  name: string;
  sourceVideo: string;
  recordingWidth: number;
  recordingHeight: number;
  captureFps: number;
  renderFps: number;
  durationMs: number;
  frameCount: number;
  maxZoom: number;
  cursorPoints: TimedPoint[];
  focusTargets: RecordedFocusTarget[];
  clicks: TimedPoint[];
  /** Exact action start times captured from the recording clock. */
  actionTimings?: Array<{ id: string; timeMs: number }>;
}

export interface PipelineProgress {
  phase: 'queued' | 'recording' | 'encoding' | 'composing' | 'synthesizing' | 'rendering' | 'qa' | 'done' | 'failed';
  percent: number;
  message: string;
}

export type TtsProvider = 'elevenlabs' | 'minimax' | 'edge-tts' | 'openai';

export interface BrowserPipelineOptions {
  withAudio?: boolean;
  burnCaptions?: boolean;
  audioProvider?: TtsProvider;
  audioVoice?: string;
  qaConfig?: string;
}

export interface BrowserPipelineResult {
  rawVideoPath: string;
  outputVideoPath: string;
  planPath: string;
  manifestPath: string;
  captureManifestPath: string;
  explainerDocumentPath: string;
  componentPath: string;
  audioManifestPath?: string;
  resolvedAudioManifestPath?: string;
  qaReportPath?: string;
  artifactManifestPath: string;
}

export interface RecorderJob extends PipelineProgress {
  id: string;
  createdAt: string;
  plan: BrowserRecordingPlan;
  rawVideoUrl?: string;
  outputVideoUrl?: string;
  manifestUrl?: string;
  artifactManifestUrl?: string;
  error?: string;
}

export interface InteractiveElement {
  selector: string;
  role: string;
  text: string;
  placeholder?: string;
  name?: string;
}
