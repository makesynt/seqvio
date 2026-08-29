import type { ExplainerDocument, SceneSpec } from "./explainer-document/schema";
import type { ExplanationBeatTiming } from "./audio";

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

export const DEFAULT_PACING_PROFILE_ID = "explainer-v1" as const;

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
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(PACING_PROFILES, value)
  );
}

export function resolvePacingProfile(id?: string): PacingProfile {
  const resolvedId = id ?? DEFAULT_PACING_PROFILE_ID;
  const profile = PACING_PROFILES[resolvedId];
  if (!profile) throw new Error(`Unsupported pacing profile: ${resolvedId}`);
  return profile;
}

export interface SpeechRateAnalysis {
  language: "zh" | "en";
  units: number;
  unit: "chars_per_second" | "words_per_minute";
  rate: number;
  status: "too_slow" | "ok" | "too_fast";
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
  if (!text.trim() || !Number.isFinite(durationMs) || durationMs <= 0)
    return undefined;
  const chineseChars = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const englishWords = (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? [])
    .length;
  const language = chineseChars >= englishWords ? "zh" : "en";
  const units = language === "zh" ? chineseChars : englishWords;
  if (units === 0) return undefined;
  const rate =
    language === "zh"
      ? units / (durationMs / 1000)
      : units / (durationMs / 60000);
  const min =
    language === "zh"
      ? policy.chineseMinCharsPerSecond
      : policy.englishMinWordsPerMinute;
  const max =
    language === "zh"
      ? policy.chineseMaxCharsPerSecond
      : policy.englishMaxWordsPerMinute;
  return {
    language,
    units,
    unit: language === "zh" ? "chars_per_second" : "words_per_minute",
    rate,
    status: rate < min ? "too_slow" : rate > max ? "too_fast" : "ok",
  };
}

export function estimateNarrationDurationMs(
  text: string,
  policy: PacingPolicy = DEFAULT_PACING_POLICY,
): number {
  const chineseChars = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const englishWords = (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? [])
    .length;
  const speechMs =
    chineseChars >= englishWords
      ? (chineseChars / policy.chineseCharsPerSecond) * 1000
      : (englishWords / policy.englishWordsPerMinute) * 60000;
  return Math.ceil(speechMs + punctuationPauseMs(text));
}

export interface ResolvedHighlightWindow {
  id: string;
  source: "beat" | "step" | "annotation" | "focus";
  startFrame: number;
  endFrame: number;
  minDurationFrames: number;
}

function explanationNarrationDurationMs(
  scene: SceneSpec,
  policy: PacingPolicy,
): number {
  const cues = scene.explanation?.cues ?? [];
  if (cues.length === 0) return 0;
  return (
    cues.reduce(
      (total, cue) => total + estimateNarrationDurationMs(cue.text, policy),
      0,
    ) +
    Math.max(0, cues.length - 1) * 180
  );
}

function applyExplanationTiming(
  scene: SceneSpec,
  fps: number,
  policy: PacingPolicy,
): {
  scene: SceneSpec;
  beats: ExplanationBeatTiming[];
  highlights: ResolvedHighlightWindow[];
} {
  const explanation = scene.explanation;
  if (!explanation?.beats.length) return { scene, beats: [], highlights: [] };
  const minFrames = minimumFrames(fps, policy);
  const captureStepFrames = new Map(
    scene.type === "terminal" || scene.type === "browser"
      ? (scene.steps ?? []).map(
          (step) => [step.id, Math.round((step.timeMs / 1000) * fps)] as const,
        )
      : [],
  );
  let cursor = 0;
  const beats: ExplanationBeatTiming[] = explanation.beats.map((beat) => {
    const evidenceFrame = beat.evidence?.captureStepId
      ? captureStepFrames.get(beat.evidence.captureStepId)
      : undefined;
    const sourceFrame = evidenceFrame ?? cursor;
    const holdFrames = Math.max(
      minFrames,
      ...beat.visuals.map((visual) =>
        Math.ceil(((visual.minHoldMs ?? policy.minHighlightMs) / 1000) * fps),
      ),
    );
    cursor = Math.max(cursor, sourceFrame) + holdFrames;
    return {
      id: `${scene.id}.${beat.id}`,
      sceneId: scene.id,
      cueId: `${scene.id}.${beat.cueId}`,
      anchor: beat.anchor,
      sourceFrame,
      visuals: beat.visuals,
      sounds: beat.sounds,
    };
  });
  const startByTarget = new Map<string, number>();
  for (const beat of beats) {
    for (const visual of beat.visuals) {
      const offsetFrames = Math.round(((visual.offsetMs ?? 0) / 1000) * fps);
      const start = Math.max(0, beat.sourceFrame + offsetFrames);
      const prior = startByTarget.get(visual.targetId);
      if (prior === undefined || start < prior)
        startByTarget.set(visual.targetId, start);
    }
  }
  let timedScene = scene;
  if (scene.type === "whiteboard") {
    timedScene = {
      ...scene,
      elements: scene.elements.map((element) => {
        if (!element.id || !startByTarget.has(element.id)) return element;
        return { ...element, start: startByTarget.get(element.id)! };
      }),
      annotations: scene.annotations?.map((annotation) =>
        startByTarget.has(annotation.id)
          ? { ...annotation, start: startByTarget.get(annotation.id)! }
          : annotation,
      ),
    };
  } else if (scene.type === "code" || scene.type === "diagram") {
    timedScene = {
      ...scene,
      steps: scene.steps.map((step) => {
        let target = step.id;
        if (!target && scene.type === "diagram") {
          target =
            "targetId" in step
              ? step.targetId
              : "edgeId" in step
                ? step.edgeId
                : undefined;
        }
        return target && startByTarget.has(target)
          ? { ...step, at: startByTarget.get(target)! }
          : step;
      }),
    } as SceneSpec;
  } else if (scene.type === "infographic") {
    const attention = beats.flatMap((beat) =>
      beat.visuals
        .filter((visual) => visual.action !== "reveal")
        .map((visual, visualIndex) => {
          const offsetFrames = Math.round(
            ((visual.offsetMs ?? 0) / 1000) * fps,
          );
          const start = Math.max(0, beat.sourceFrame + offsetFrames);
          const duration = Math.max(
            minFrames,
            Math.ceil(
              ((visual.minHoldMs ?? policy.minHighlightMs) / 1000) * fps,
            ),
          );
          return {
            id: `${beat.id}.attention-${visualIndex + 1}`,
            targetId: visual.targetId,
            kind:
              visual.action === "focus"
                ? ("spotlight" as const)
                : visual.action === "annotate"
                  ? ("arrow" as const)
                  : visual.action === "compare"
                    ? ("connector" as const)
                    : visual.action === "trace"
                      ? ("guided-path" as const)
                      : ("box" as const),
            toTargetId: visual.relatedTargetId,
            pathTargetIds: visual.pathTargetIds,
            start,
            duration,
            minHoldFrames: duration,
            sourceBeatId: beat.id,
            sceneId: scene.id,
            persistence: "until-handoff" as const,
          };
        }),
    );
    timedScene = {
      ...scene,
      metrics: scene.metrics?.map((item) =>
        startByTarget.has(item.id)
          ? { ...item, at: startByTarget.get(item.id)! }
          : item,
      ),
      comparisons: scene.comparisons?.map((item) =>
        startByTarget.has(item.id)
          ? { ...item, at: startByTarget.get(item.id)! }
          : item,
      ),
      process: scene.process?.map((item) =>
        startByTarget.has(item.id)
          ? { ...item, at: startByTarget.get(item.id)! }
          : item,
      ),
      timeline: scene.timeline?.map((item) =>
        startByTarget.has(item.id)
          ? { ...item, at: startByTarget.get(item.id)! }
          : item,
      ),
      relationships: scene.relationships?.map((item) =>
        startByTarget.has(item.id)
          ? { ...item, at: startByTarget.get(item.id)! }
          : item,
      ),
      attention: attention.map((item, index) => ({
        ...item,
        handoffTo: attention[index + 1]?.targetId,
      })),
    };
  } else if (scene.type === "browser") {
    timedScene = {
      ...scene,
      focusTargets: scene.focusTargets?.map((target) =>
        target.id && startByTarget.has(target.id)
          ? { ...target, timeMs: (startByTarget.get(target.id)! / fps) * 1000 }
          : target,
      ),
    };
  }
  const highlights = beats.map((beat, index) => ({
    id: beat.id,
    source: "beat" as const,
    startFrame: beat.sourceFrame,
    endFrame: index + 1 < beats.length ? beats[index + 1].sourceFrame : cursor,
    minDurationFrames: minFrames,
  }));
  return { scene: timedScene, beats, highlights };
}

function minimumFrames(fps: number, policy: PacingPolicy): number {
  return Math.max(1, Math.ceil((policy.minHighlightMs / 1000) * fps));
}

function baseSceneDurationFrames(
  scene: SceneSpec,
  fps: number,
  policy: PacingPolicy,
): number {
  if (typeof scene.duration === "number" && scene.duration > 0)
    return scene.duration;
  const tail = Math.ceil((policy.sceneTailMs / 1000) * fps);
  if (scene.type === "whiteboard") {
    return (
      Math.max(
        1,
        ...scene.elements.map(
          (element) => (element.start ?? 0) + (element.duration ?? 30),
        ),
      ) + tail
    );
  }
  if (scene.type === "code" || scene.type === "diagram") {
    return Math.max(1, ...scene.steps.map((step) => step.at + 90)) + tail;
  }
  if (scene.type === "terminal") {
    const maxMs = Math.max(
      0,
      ...(scene.events ?? []).map((event) => event.timeMs),
      ...(scene.steps ?? []).map((step) => step.timeMs),
    );
    return Math.max(1, Math.ceil((maxMs / 1000) * fps) + tail);
  }
  if (scene.type === "infographic") {
    const itemEnds = [
      ...(scene.metrics ?? []),
      ...(scene.comparisons ?? []),
      ...(scene.process ?? []),
      ...(scene.timeline ?? []),
      ...(scene.relationships ?? []),
    ].map((item) => (item.at ?? 0) + 30);
    const attentionEnds = (scene.attention ?? []).map(
      (item) => item.start + Math.max(item.duration, item.minHoldFrames ?? 0),
    );
    return Math.max(120, ...itemEnds, ...attentionEnds) + tail;
  }
  if (scene.type === "browser") {
    const maxMs = Math.max(
      0,
      ...(scene.cursorPoints ?? []).map((point) => point.timeMs),
      ...(scene.focusTargets ?? []).map((point) => point.timeMs),
      ...(scene.clicks ?? []).map((point) => point.timeMs),
    );
    return Math.max(120, Math.ceil((maxMs / 1000) * fps) + tail);
  }
  return 120;
}

function retimeAuthoredSteps(
  scene: SceneSpec,
  fps: number,
  policy: PacingPolicy,
): SceneSpec {
  const gap = minimumFrames(fps, policy);
  const annotated = {
    ...scene,
    annotations: scene.annotations?.map((annotation) => ({
      ...annotation,
      duration: Math.max(annotation.duration, gap),
    })),
  } as SceneSpec;
  if (annotated.type === "code" || annotated.type === "diagram") {
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
): {
  scene: SceneSpec;
  durationFrames: number;
  highlights: ResolvedHighlightWindow[];
  explanationBeats: ExplanationBeatTiming[];
} {
  const authoredScene = retimeAuthoredSteps(scene, fps, policy);
  const explanationTiming = applyExplanationTiming(authoredScene, fps, policy);
  const pacedScene = explanationTiming.scene;
  const minFrames = minimumFrames(fps, policy);
  let durationFrames = baseSceneDurationFrames(pacedScene, fps, policy);
  if (pacedScene.narration?.trim()) {
    durationFrames = Math.max(
      durationFrames,
      Math.ceil(
        ((estimateNarrationDurationMs(pacedScene.narration, policy) +
          policy.sceneTailMs) /
          1000) *
          fps,
      ),
    );
  }
  const explanationMs = explanationNarrationDurationMs(pacedScene, policy);
  if (explanationMs > 0) {
    durationFrames = Math.max(
      durationFrames,
      Math.ceil(((explanationMs + policy.sceneTailMs) / 1000) * fps),
    );
  }
  const stepStarts =
    pacedScene.type === "code" || pacedScene.type === "diagram"
      ? pacedScene.steps.map((step) => step.at)
      : pacedScene.type === "terminal"
        ? (pacedScene.steps ?? []).map((step) =>
            Math.round((step.timeMs / 1000) * fps),
          )
        : [];
  durationFrames = Math.max(
    durationFrames,
    ...stepStarts.map((start) => start + minFrames),
  );
  const highlights: ResolvedHighlightWindow[] = pacedScene.explanation
    ? [...explanationTiming.highlights]
    : stepStarts.map((startFrame, index) => ({
        id: `${pacedScene.id}.steps[${index}]`,
        source: "step",
        startFrame,
        endFrame:
          index + 1 < stepStarts.length
            ? stepStarts[index + 1]
            : durationFrames,
        minDurationFrames: minFrames,
      }));
  for (const [index, annotation] of (pacedScene.annotations ?? []).entries()) {
    highlights.push({
      id: `${pacedScene.id}.annotations[${index}]`,
      source: "annotation",
      startFrame: annotation.start,
      endFrame: annotation.start + annotation.duration,
      minDurationFrames: minFrames,
    });
  }
  if (pacedScene.type === "browser") {
    const starts = (pacedScene.focusTargets ?? []).map((target) =>
      Math.round((target.timeMs / 1000) * fps),
    );
    starts.forEach((startFrame, index) =>
      highlights.push({
        id: `${pacedScene.id}.focusTargets[${index}]`,
        source: "focus",
        startFrame,
        endFrame:
          index + 1 < starts.length ? starts[index + 1] : durationFrames,
        minDurationFrames: minFrames,
      }),
    );
  }
  durationFrames = Math.max(
    durationFrames,
    ...highlights.map((highlight) => highlight.endFrame),
  );
  return {
    scene: { ...pacedScene, duration: durationFrames },
    durationFrames,
    highlights,
    explanationBeats: explanationTiming.beats,
  };
}

export function resolveCompositionPacing(
  doc: ExplainerDocument,
  policy: PacingPolicy = DEFAULT_PACING_POLICY,
): ExplainerDocument {
  const fps = doc.fps ?? 30;
  return {
    ...doc,
    scenes: doc.scenes.map(
      (scene) => resolveScenePacing(scene, fps, policy).scene,
    ),
  };
}
