import type { CompositionDocument, SceneSpec } from './composition-document/schema';

export interface PacingPolicy {
  chineseCharsPerSecond: number;
  englishWordsPerMinute: number;
  chineseMinCharsPerSecond: number;
  chineseMaxCharsPerSecond: number;
  englishMinWordsPerMinute: number;
  englishMaxWordsPerMinute: number;
  minHighlightMs: number;
  sceneTailMs: number;
  maxSceneStretchRatio: number;
}

export const DEFAULT_PACING_PROFILE_ID = 'explainer-v1' as const;

export interface PacingProfile {
  id: string;
  version: 1;
  policy: PacingPolicy;
}

export const DEFAULT_PACING_POLICY: PacingPolicy = {
  chineseCharsPerSecond: 3.7,
  englishWordsPerMinute: 150,
  chineseMinCharsPerSecond: 2.5,
  chineseMaxCharsPerSecond: 4.8,
  englishMinWordsPerMinute: 110,
  englishMaxWordsPerMinute: 190,
  minHighlightMs: 900,
  sceneTailMs: 600,
  maxSceneStretchRatio: 2,
};

export const PACING_PROFILES: Readonly<Record<string, PacingProfile>> = {
  [DEFAULT_PACING_PROFILE_ID]: {
    id: DEFAULT_PACING_PROFILE_ID,
    version: 1,
    policy: DEFAULT_PACING_POLICY,
  },
};

export function isPacingProfileId(value: unknown): value is string {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PACING_PROFILES, value);
}

export function resolvePacingProfile(id?: string): PacingProfile {
  const resolvedId = id ?? DEFAULT_PACING_PROFILE_ID;
  const profile = PACING_PROFILES[resolvedId];
  if (!profile) throw new Error(`Unsupported pacing profile: ${resolvedId}`);
  return profile;
}

export interface SpeechRateAnalysis {
  language: 'zh' | 'en';
  units: number;
  unit: 'chars_per_second' | 'words_per_minute';
  rate: number;
  status: 'too_slow' | 'ok' | 'too_fast';
}

function punctuationPauseMs(text: string): number {
  const shortPauses = (text.match(/[,，、;；:：]/g) ?? []).length;
  const longPauses = (text.match(/[.!?。！？]/g) ?? []).length;
  return shortPauses * 120 + longPauses * 240;
}

export function analyzeSpeechRate(
  text: string,
  durationMs: number,
  policy: PacingPolicy = DEFAULT_PACING_POLICY,
): SpeechRateAnalysis | undefined {
  if (!text.trim() || !Number.isFinite(durationMs) || durationMs <= 0) return undefined;
  const chineseChars = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const englishWords = (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []).length;
  const language = chineseChars >= englishWords ? 'zh' : 'en';
  const units = language === 'zh' ? chineseChars : englishWords;
  if (units === 0) return undefined;
  const rate = language === 'zh'
    ? units / (durationMs / 1000)
    : units / (durationMs / 60000);
  const min = language === 'zh' ? policy.chineseMinCharsPerSecond : policy.englishMinWordsPerMinute;
  const max = language === 'zh' ? policy.chineseMaxCharsPerSecond : policy.englishMaxWordsPerMinute;
  return {
    language,
    units,
    unit: language === 'zh' ? 'chars_per_second' : 'words_per_minute',
    rate,
    status: rate < min ? 'too_slow' : rate > max ? 'too_fast' : 'ok',
  };
}

export function estimateNarrationDurationMs(
  text: string,
  policy: PacingPolicy = DEFAULT_PACING_POLICY,
): number {
  const chineseChars = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const englishWords = (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []).length;
  const speechMs = chineseChars >= englishWords
    ? (chineseChars / policy.chineseCharsPerSecond) * 1000
    : (englishWords / policy.englishWordsPerMinute) * 60000;
  return Math.ceil(speechMs + punctuationPauseMs(text));
}

export interface ResolvedHighlightWindow {
  id: string;
  source: 'step' | 'annotation' | 'focus';
  startFrame: number;
  endFrame: number;
  minDurationFrames: number;
}

function minimumFrames(fps: number, policy: PacingPolicy): number {
  return Math.max(1, Math.ceil((policy.minHighlightMs / 1000) * fps));
}

function baseSceneDurationFrames(scene: SceneSpec, fps: number, policy: PacingPolicy): number {
  if (typeof scene.duration === 'number' && scene.duration > 0) return scene.duration;
  const tail = Math.ceil((policy.sceneTailMs / 1000) * fps);
  if (scene.type === 'whiteboard') {
    return Math.max(1, ...scene.elements.map((element) => (element.start ?? 0) + (element.duration ?? 30))) + tail;
  }
  if (scene.type === 'code' || scene.type === 'diagram') {
    return Math.max(1, ...scene.steps.map((step) => step.at + 90)) + tail;
  }
  if (scene.type === 'terminal') {
    const maxMs = Math.max(0, ...(scene.events ?? []).map((event) => event.timeMs), ...(scene.steps ?? []).map((step) => step.timeMs));
    return Math.max(1, Math.ceil((maxMs / 1000) * fps) + tail);
  }
  if (scene.type === 'browser') {
    const maxMs = Math.max(0, ...(scene.cursorPoints ?? []).map((point) => point.timeMs), ...(scene.focusTargets ?? []).map((point) => point.timeMs), ...(scene.clicks ?? []).map((point) => point.timeMs));
    return Math.max(120, Math.ceil((maxMs / 1000) * fps) + tail);
  }
  return 120;
}

function retimeAuthoredSteps(scene: SceneSpec, fps: number, policy: PacingPolicy): SceneSpec {
  const gap = minimumFrames(fps, policy);
  const annotated = {
    ...scene,
    annotations: scene.annotations?.map((annotation) => ({
      ...annotation,
      duration: Math.max(annotation.duration, gap),
    })),
  } as SceneSpec;
  if (annotated.type === 'code' || annotated.type === 'diagram') {
    let previous = -gap;
    return {
      ...annotated,
      steps: annotated.steps.map((step) => {
        const at = Math.max(step.at, previous + gap);
        previous = at;
        return { ...step, at };
      }),
    } as SceneSpec;
  }
  return annotated;
}

export function resolveScenePacing(
  scene: SceneSpec,
  fps: number,
  policy: PacingPolicy = DEFAULT_PACING_POLICY,
): { scene: SceneSpec; durationFrames: number; highlights: ResolvedHighlightWindow[] } {
  const pacedScene = retimeAuthoredSteps(scene, fps, policy);
  const minFrames = minimumFrames(fps, policy);
  let durationFrames = baseSceneDurationFrames(pacedScene, fps, policy);
  if (pacedScene.narration?.trim()) {
    durationFrames = Math.max(
      durationFrames,
      Math.ceil(((estimateNarrationDurationMs(pacedScene.narration, policy) + policy.sceneTailMs) / 1000) * fps),
    );
  }
  const stepStarts = pacedScene.type === 'code' || pacedScene.type === 'diagram'
    ? pacedScene.steps.map((step) => step.at)
    : pacedScene.type === 'terminal'
      ? (pacedScene.steps ?? []).map((step) => Math.round((step.timeMs / 1000) * fps))
      : [];
  durationFrames = Math.max(durationFrames, ...stepStarts.map((start) => start + minFrames));
  const highlights: ResolvedHighlightWindow[] = stepStarts.map((startFrame, index) => ({
    id: `${pacedScene.id}.steps[${index}]`,
    source: 'step',
    startFrame,
    endFrame: index + 1 < stepStarts.length ? stepStarts[index + 1] : durationFrames,
    minDurationFrames: minFrames,
  }));
  for (const [index, annotation] of (pacedScene.annotations ?? []).entries()) {
    highlights.push({
      id: `${pacedScene.id}.annotations[${index}]`,
      source: 'annotation',
      startFrame: annotation.start,
      endFrame: annotation.start + annotation.duration,
      minDurationFrames: minFrames,
    });
  }
  if (pacedScene.type === 'browser') {
    const starts = (pacedScene.focusTargets ?? []).map((target) => Math.round((target.timeMs / 1000) * fps));
    starts.forEach((startFrame, index) => highlights.push({
      id: `${pacedScene.id}.focusTargets[${index}]`,
      source: 'focus',
      startFrame,
      endFrame: index + 1 < starts.length ? starts[index + 1] : durationFrames,
      minDurationFrames: minFrames,
    }));
  }
  durationFrames = Math.max(durationFrames, ...highlights.map((highlight) => highlight.endFrame));
  return { scene: { ...pacedScene, duration: durationFrames }, durationFrames, highlights };
}

export function resolveCompositionPacing(
  doc: CompositionDocument,
  policy: PacingPolicy = DEFAULT_PACING_POLICY,
): CompositionDocument {
  const fps = doc.fps ?? 30;
  return { ...doc, scenes: doc.scenes.map((scene) => resolveScenePacing(scene, fps, policy).scene) };
}
