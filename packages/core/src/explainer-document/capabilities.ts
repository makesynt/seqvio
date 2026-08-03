export const FEATURE_LIFECYCLES = [
  'public',
  'experimental',
  'internal',
  'deprecated',
  'removed',
] as const;

export type FeatureLifecycle = (typeof FEATURE_LIFECYCLES)[number];

export interface SceneCapability {
  type: string;
  schemaVersion: '1.0';
  compiler: 'complete';
  requiredPackage: string;
  lifecycle: FeatureLifecycle;
  /** Capture-derived scenes must not be invented by a planning agent. */
  agentAuthoring: boolean;
  authoringSummary: string;
  qaRules: readonly string[];
}

export const SCENE_CAPABILITIES = {
  whiteboard: {
    type: 'whiteboard', schemaVersion: '1.0', compiler: 'complete',
    requiredPackage: '@seqvio/whiteboard', lifecycle: 'public', agentAuthoring: true,
    authoringSummary: 'elements = text | shape | image | icon',
    qaRules: ['visual-layout', 'pacing', 'audio-timeline', 'explanation-beats'],
  },
  code: {
    type: 'code', schemaVersion: '1.0', compiler: 'complete',
    requiredPackage: '@seqvio/technical', lifecycle: 'public', agentAuthoring: true,
    authoringSummary: 'language, source, steps = type | focus | insert | replace | delete | annotate',
    qaRules: ['visual-layout', 'pacing', 'audio-timeline', 'explanation-beats'],
  },
  diagram: {
    type: 'diagram', schemaVersion: '1.0', compiler: 'complete',
    requiredPackage: '@seqvio/technical', lifecycle: 'public', agentAuthoring: true,
    authoringSummary: 'nodes, edges, steps = reveal | connect | trace | emphasize',
    qaRules: ['visual-layout', 'pacing', 'audio-timeline', 'explanation-beats'],
  },
  terminal: {
    type: 'terminal', schemaVersion: '1.0', compiler: 'complete',
    requiredPackage: '@seqvio/technical', lifecycle: 'public', agentAuthoring: false,
    authoringSummary: 'capture-derived PTY events, xterm snapshots, and recorded steps',
    qaRules: ['visual-layout', 'capture-state', 'pacing', 'audio-timeline', 'explanation-beats'],
  },
  browser: {
    type: 'browser', schemaVersion: '1.0', compiler: 'complete',
    requiredPackage: '@seqvio/product-demo', lifecycle: 'public', agentAuthoring: false,
    authoringSummary: 'capture-derived video, cursor, focus, click, and recorded steps',
    qaRules: ['visual-layout', 'capture-state', 'capture-media', 'pacing', 'audio-timeline', 'explanation-beats'],
  },
} as const satisfies Record<string, SceneCapability>;

export type SceneType = keyof typeof SCENE_CAPABILITIES;

export const SCENE_TYPES = Object.freeze(
  Object.keys(SCENE_CAPABILITIES) as SceneType[],
);

export function isSceneType(value: unknown): value is SceneType {
  return typeof value === 'string' && value in SCENE_CAPABILITIES;
}

export function getSceneCapability(type: SceneType): SceneCapability {
  return SCENE_CAPABILITIES[type];
}

export function listAgentAuthorableSceneCapabilities(): SceneCapability[] {
  return SCENE_TYPES
    .map((type) => SCENE_CAPABILITIES[type])
    .filter((capability) => capability.lifecycle === 'public' && capability.agentAuthoring);
}
