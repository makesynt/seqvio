/**
 * ExplainerDocument -> TSX compiler.
 *
 * Whiteboard scenes compile to @seqvio/whiteboard components.
 * Technical scenes compile to @seqvio/technical components.
 */

import {
  STORYBOARD_DEFAULTS,
  type StoryboardScene,
} from '../storyboard/schema';
import {
  compileWhiteboardSceneBody,
  sceneComponentName,
  pascalId,
} from '../storyboard/compile-helpers';
import {
  EXPLAINER_DOCUMENT_DEFAULTS,
  type AnnotationSpec,
  type CodeSceneSpec,
  type ExplainerDocument,
  type DiagramSceneSpec,
  type InfographicSceneSpec,
  type ManimSceneSpec,
  type SceneSpec,
} from './schema';
import { sceneDurationFrames } from './timeline';
import {
  estimateNarrationDurationMs,
  resolveCompositionPacing,
  resolvePacingProfile,
  resolveScenePacing,
} from '../pacing';
import {
  compileDirectionPlan,
  deriveDirectionPlan,
  type CompiledDirectionPlan,
  type DirectionPlan,
} from '../direction';

function resolved(doc: ExplainerDocument) {
  return {
    id: doc.id,
    width: doc.width ?? EXPLAINER_DOCUMENT_DEFAULTS.width,
    height: doc.height ?? EXPLAINER_DOCUMENT_DEFAULTS.height,
    fps: doc.fps ?? EXPLAINER_DOCUMENT_DEFAULTS.fps,
    backgroundColor: doc.backgroundColor ?? EXPLAINER_DOCUMENT_DEFAULTS.backgroundColor,
    lockToAudio: doc.lockToAudio ?? EXPLAINER_DOCUMENT_DEFAULTS.lockToAudio,
    transitionDuration:
      doc.transitionDuration ?? EXPLAINER_DOCUMENT_DEFAULTS.transitionDuration,
    texture: STORYBOARD_DEFAULTS.texture,
    styleId: STORYBOARD_DEFAULTS.styleId,
  };
}

function whiteboardSceneAsStoryboard(scene: Extract<SceneSpec, { type: 'whiteboard' }>): StoryboardScene {
  const { type: _type, annotations: _annotations, ...rest } = scene;
  return rest;
}

function serializeAnnotations(annotations: AnnotationSpec[] | undefined): string {
  if (!annotations || annotations.length === 0) return '[]';
  return JSON.stringify(annotations, null, 2);
}

function compileWhiteboardSceneComponent(
  scene: Extract<SceneSpec, { type: 'whiteboard' }>,
  componentName: string,
  board: ReturnType<typeof resolved>
): string {
  const storyboardScene = whiteboardSceneAsStoryboard(scene);
  const body = compileWhiteboardSceneBody(storyboardScene, board);
  const annotations = serializeAnnotations(scene.annotations);
  const wrapped = scene.annotations && scene.annotations.length > 0;
  if (!wrapped) {
    return `function ${componentName}() {
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture={STYLE.texture ?? ${JSON.stringify(board.texture)}}
      background={STYLE.background}
      theme={STYLE.theme ?? excalidrawTheme}
    >
${body}
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}`;
  }

  return `function ${componentName}() {
  return (
    <TechnicalScene width={W} height={H} annotations={${annotations}}>
      <AnnotationTarget id=${JSON.stringify(scene.id)} style={{ width: '100%', height: '100%' }}>
        <WhiteboardScene
          width={W}
          height={H}
          texture={STYLE.texture ?? ${JSON.stringify(board.texture)}}
          background={STYLE.background}
          theme={STYLE.theme ?? excalidrawTheme}
        >
${body}
          <Hand action="write" follow={true} visible={true} />
        </WhiteboardScene>
      </AnnotationTarget>
    </TechnicalScene>
  );
}`;
}

function compileCodeScene(scene: CodeSceneSpec, componentName: string): string {
  const annotations = serializeAnnotations(scene.annotations);
  return `function ${componentName}() {
  return (
    <TechnicalScene width={W} height={H} annotations={${annotations}}>
      <CodeWalkthrough
        id=${JSON.stringify(scene.id)}
        language=${JSON.stringify(scene.language)}
        source={${JSON.stringify(scene.source)}}
        steps={${JSON.stringify(scene.steps, null, 2)}}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}`;
}

function compileDiagramScene(scene: DiagramSceneSpec, componentName: string): string {
  const annotations = serializeAnnotations(scene.annotations);
  return `function ${componentName}() {
  return (
    <TechnicalScene width={W} height={H} annotations={${annotations}}>
      <ArchitectureDiagram
        id=${JSON.stringify(scene.id)}
        nodes={${JSON.stringify(scene.nodes, null, 2)}}
        edges={${JSON.stringify(scene.edges, null, 2)}}
        steps={${JSON.stringify(scene.steps, null, 2)}}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}`;
}

function compileInfographicScene(scene: InfographicSceneSpec, componentName: string): string {
  const annotations = serializeAnnotations(scene.annotations);
  return `function ${componentName}() {
  return (
    <TechnicalScene width={W} height={H} annotations={${annotations}}>
      <InfographicScene
        id=${JSON.stringify(scene.id)}
        title=${JSON.stringify(scene.title)}
        metrics={${JSON.stringify(scene.metrics ?? [], null, 2)}}
        comparisons={${JSON.stringify(scene.comparisons ?? [], null, 2)}}
        process={${JSON.stringify(scene.process ?? [], null, 2)}}
        timeline={${JSON.stringify(scene.timeline ?? [], null, 2)}}
        relationshipNodes={${JSON.stringify(scene.relationshipNodes ?? [], null, 2)}}
        relationships={${JSON.stringify(scene.relationships ?? [], null, 2)}}
        charts={${JSON.stringify(scene.charts ?? [], null, 2)}}
        attention={${JSON.stringify(scene.attention ?? [], null, 2)}}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}`;
}

function compileTerminalScene(scene: Extract<SceneSpec, { type: 'terminal' }>, componentName: string): string {
  const annotations = serializeAnnotations(scene.annotations);
  const legacyEvents = (scene.commands ?? []).map((command, index) => ({
    timeMs: index * 1200,
    kind: 'stdout' as const,
    text: `$ ${command}\n`,
  }));
  const legacySteps = (scene.commands ?? []).map((command, index) => ({
    id: `${scene.id}-command-${index + 1}`,
    label: command,
    timeMs: index * 1200,
  }));
  const events = JSON.stringify(scene.events?.length ? scene.events : legacyEvents, null, 2);
  const steps = JSON.stringify(scene.steps?.length ? scene.steps : legacySteps, null, 2);
  const ro = scene.renderOptions;
  const prop = (name: string, value: unknown, asString = false): string =>
    value === undefined
      ? ''
      : asString
        ? `${name}=${JSON.stringify(value)}`
        : `${name}={${JSON.stringify(value)}}`;

  return `function ${componentName}() {
  return (
    <TerminalXtermDemo
      id=${JSON.stringify(scene.id)}
      ${prop('title', ro?.title, true)}
      events={${events}}
      steps={${steps}}
      width={W}
      height={H}
      ${prop('maxLines', scene.maxLines)}
      ${prop('cols', scene.cols)}
      ${prop('rows', scene.rows)}
      ${prop('presentation', ro?.presentation, true)}
      ${prop('typingCps', ro?.typingCps)}
      ${prop('cursorBlink', ro?.cursorBlink)}
      ${prop('zoomOnInput', ro?.zoomOnInput)}
      ${prop('maxZoom', ro?.maxZoom)}
      ${prop('zoomTransitionMs', ro?.zoomTransitionMs)}
      ${prop('zoomHoldMs', ro?.zoomHoldMs)}
    />
  );
}`;
}

function compileBrowserScene(
  scene: Extract<SceneSpec, { type: 'browser' }>,
  componentName: string
): string {
  const annotations = serializeAnnotations(scene.annotations);
  const recordingWidth = scene.recordingWidth ?? 'W';
  const recordingHeight = scene.recordingHeight ?? 'H';
  const maxZoom = scene.maxZoom ?? 2;
  const cursorPoints = JSON.stringify(scene.cursorPoints ?? [], null, 2);
  const focusTargets = JSON.stringify(scene.focusTargets ?? [], null, 2);
  const clicks = JSON.stringify(scene.clicks ?? [], null, 2);
  return `function ${componentName}() {
  return (
    <TechnicalScene width={W} height={H} annotations={${annotations}}>
      <AnnotationTarget id=${JSON.stringify(scene.id)} style={{ width: '100%', height: '100%' }}>
        <RecordedBrowserDemo
          id=${JSON.stringify(scene.id)}
          src=${JSON.stringify(scene.sourceVideo)}
          recordingWidth={${recordingWidth}}
          recordingHeight={${recordingHeight}}
          width={W}
          height={H}
          fps={FPS}
          maxZoom={${maxZoom}}
          focusTargets={${focusTargets}}
          cursorPoints={${cursorPoints}}
          clicks={${clicks}}
        />
      </AnnotationTarget>
    </TechnicalScene>
  );
}`;
}

function compileManimScene(scene: ManimSceneSpec, componentName: string): string {
  const annotations = serializeAnnotations(scene.annotations);
  return `function ${componentName}() {
  return (
    <TechnicalScene width={W} height={H} annotations={${annotations}}>
      <ManimClip
        id=${JSON.stringify(scene.id)}
        src=${JSON.stringify(scene.sourceVideo)}
        width={${scene.mediaWidth ?? 'W'}}
        height={${scene.mediaHeight ?? 'H'}}
        fps={${scene.mediaFps ?? 'FPS'}}
        fit=${JSON.stringify(scene.fit ?? 'contain')}
        markers={${JSON.stringify(scene.markers ?? [], null, 2)}}
      />
    </TechnicalScene>
  );
}`;
}

function unsupportedSceneType(scene: never): never {
  const type = (scene as { type?: unknown }).type;
  throw new Error(`Unsupported ExplainerDocument scene type: ${String(type)}`);
}

function compileSceneComponent(
  scene: SceneSpec,
  componentName: string,
  board: ReturnType<typeof resolved>
): string {
  switch (scene.type) {
    case 'whiteboard':
      return compileWhiteboardSceneComponent(scene, componentName, board);
    case 'code':
      return compileCodeScene(scene, componentName);
    case 'diagram':
      return compileDiagramScene(scene, componentName);
    case 'infographic':
      return compileInfographicScene(scene, componentName);
    case 'terminal':
      return compileTerminalScene(scene, componentName);
    case 'browser':
      return compileBrowserScene(scene, componentName);
    case 'manim':
      return compileManimScene(scene, componentName);
  }

  return unsupportedSceneType(scene);
}

function sceneDurationFramesForCompile(scene: SceneSpec, fps: number): number {
  return sceneDurationFrames(scene, fps);
}

export interface CompileCompositionResult {
  code: string;
  directionPlan: DirectionPlan;
  compiledDirection: CompiledDirectionPlan;
}

export function compileExplainerDocumentToTsx(
  doc: ExplainerDocument
): CompileCompositionResult {
  const pacingProfile = resolvePacingProfile(doc.pacingProfile);
  const pacedDoc = resolveCompositionPacing(doc, pacingProfile.policy);
  const directionPlan = deriveDirectionPlan(pacedDoc);
  const compiledDirection = compileDirectionPlan(directionPlan);
  const r = resolved(pacedDoc);
  const sceneNames = pacedDoc.scenes.map((scene, index) =>
    sceneComponentName(scene.id, index)
  );

  const usesWhiteboard = pacedDoc.scenes.some((scene) => scene.type === 'whiteboard');
  const usesTechnical = pacedDoc.scenes.some((scene) => scene.type !== 'whiteboard') ||
    pacedDoc.scenes.some((scene) => scene.annotations && scene.annotations.length > 0);

  const sceneFns = pacedDoc.scenes
    .map((scene, index) => compileSceneComponent(scene, sceneNames[index], r))
    .join('\n\n');

  const sceneDurations = pacedDoc.scenes.map((scene) => sceneDurationFramesForCompile(scene, r.fps));
  const totalDuration =
    sceneDurations.reduce((sum, d) => sum + d, 0) +
    Math.max(0, pacedDoc.scenes.length - 1) * r.transitionDuration;

  let sceneCursor = 0;
  const sceneStarts = sceneDurations.map((duration, index) => {
    const start = sceneCursor;
    sceneCursor += duration + (index < sceneDurations.length - 1 ? r.transitionDuration : 0);
    return start;
  });
  const scenePacing = pacedDoc.scenes.map((scene) =>
    resolveScenePacing(scene, r.fps, pacingProfile.policy)
  );
  const pacingHighlights = scenePacing.flatMap((pacing, index) =>
    pacing.highlights.map((highlight) => ({
      ...highlight,
      startFrame: highlight.startFrame + sceneStarts[index],
      endFrame: highlight.endFrame + sceneStarts[index],
    })),
  );
  const audioSceneTimings = pacedDoc.scenes.map((scene, index) => ({
    sceneId: scene.id,
    startFrame: sceneStarts[index],
    durationFrames: sceneDurations[index],
    sourceDurationFrames: sceneDurations[index],
    transitionAfterFrames: index < pacedDoc.scenes.length - 1 ? r.transitionDuration : 0,
    highlights: scenePacing[index].highlights,
  }));
  const explanationBeats = scenePacing.flatMap((pacing) => pacing.explanationBeats);
  const narrationCueData = pacedDoc.scenes.flatMap((scene, index) => {
    const sceneStartMs = Math.round((sceneStarts[index] / r.fps) * 1000);
    if (scene.explanation?.cues.length) {
      let cueCursorMs = sceneStartMs;
      return scene.explanation.cues.map((cue, cueIndex) => {
        const durationMs = estimateNarrationDurationMs(cue.text, pacingProfile.policy);
        const resolvedCue = {
          id: `${scene.id}.${cue.id}`,
          sceneId: scene.id,
          text: cue.text,
          voice: cue.voice,
          startMs: cueCursorMs,
          endMs: cueCursorMs + durationMs,
        };
        cueCursorMs += durationMs + (cueIndex < scene.explanation!.cues.length - 1 ? 180 : 0);
        return resolvedCue;
      });
    }
    if (scene.narration?.trim()) {
      return [{
        id: scene.id,
        sceneId: scene.id,
        text: scene.narration,
        startMs: sceneStartMs,
        endMs: sceneStartMs + estimateNarrationDurationMs(scene.narration, pacingProfile.policy),
      }];
    }
    return [];
  });
  const hasNarration = narrationCueData.length > 0;

  const sceneTree = pacedDoc.scenes
    .map((scene, index) => {
      const durationAttr = ` duration={${sceneDurations[index]}}`;
      const tag = `      <Scene id=${JSON.stringify(scene.id)}${durationAttr}>\n        <${sceneNames[index]} />\n      </Scene>`;
      const needsTransition = index < doc.scenes.length - 1 && r.transitionDuration > 0;
      const transition = needsTransition
        ? `\n      <Transition type="fade" duration={${r.transitionDuration}} />`
        : '';
      return tag + transition;
    })
    .join('\n');

  const narrationCues = JSON.stringify(narrationCueData, null, 2);

  const whiteboardImports = usesWhiteboard
    ? `import {
  DrawShape,
  DrawText,
  DrawImage,
  DrawIcon,
  Hand,
  WhiteboardScene,
  excalidrawTheme,
  getSeqvioStylePreset,
} from '@seqvio/whiteboard';`
    : '';

  const technicalImports = usesTechnical
    ? `import {
  TechnicalScene,
  AnnotationTarget,
  CodeWalkthrough,
  ArchitectureDiagram,
  InfographicScene,
  ManimClip,
  TerminalXtermDemo,
} from '@seqvio/technical';`
    : '';
  const usesProductDemo = pacedDoc.scenes.some((scene) => scene.type === 'browser');
  const productDemoImports = usesProductDemo
    ? `import { RecordedBrowserDemo } from '@seqvio/product-demo';`
    : '';

  const styleBlock = usesWhiteboard
    ? `const STYLE_ID = ${JSON.stringify(r.styleId)};
const STYLE = getSeqvioStylePreset(STYLE_ID) ?? {
  texture: ${JSON.stringify(r.texture)},
  background: ${JSON.stringify(r.backgroundColor)},
  theme: excalidrawTheme,
};`
    : '';

  const code = `// AUTO-GENERATED from a Seqvio ExplainerDocument. Safe to edit by hand.
import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene, Transition } from '@seqvio/core';
${whiteboardImports}
${technicalImports}
${productDemoImports}

const W = ${r.width};
const H = ${r.height};
const FPS = ${r.fps};
${styleBlock}

${sceneFns}

export default function ${pascalId(r.id)}() {
  return (
    <VideoComposition
      id=${JSON.stringify(r.id)}
      width={W}
      height={H}
      fps={FPS}
      backgroundColor=${JSON.stringify(r.backgroundColor)}${hasNarration ? '\n      audio={meta.audio}' : ''}
    >
${sceneTree}
    </VideoComposition>
  );
}

${
  hasNarration
    ? `export const meta: RenderableMeta = {
  fps: FPS,
  duration: ${totalDuration},
  width: W,
  height: H,
  pacing: { profile: ${JSON.stringify(pacingProfile.id)}, highlights: ${JSON.stringify(pacingHighlights, null, 2)} },
  direction: ${JSON.stringify(compiledDirection, null, 2)},
  audio: {
    fps: FPS,
    lockToAudio: ${r.lockToAudio},
    pacingProfile: ${JSON.stringify(pacingProfile.id)},
    sceneTimings: ${JSON.stringify(audioSceneTimings, null, 2)},
    explanationBeats: ${JSON.stringify(explanationBeats, null, 2)},
    narration: ${narrationCues},
  },
};`
    : `export const meta: RenderableMeta = {
  fps: FPS,
  duration: ${totalDuration},
  width: W,
  height: H,
  pacing: { profile: ${JSON.stringify(pacingProfile.id)}, highlights: ${JSON.stringify(pacingHighlights, null, 2)} },
  direction: ${JSON.stringify(compiledDirection, null, 2)},
};`
}
`;

  return { code, directionPlan, compiledDirection };
}
