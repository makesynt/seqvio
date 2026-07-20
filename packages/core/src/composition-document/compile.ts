/**
 * CompositionDocument v2 -> TSX compiler.
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
  COMPOSITION_DOCUMENT_DEFAULTS,
  type AnnotationSpec,
  type CodeSceneSpec,
  type CompositionDocument,
  type DiagramSceneSpec,
  type SceneSpec,
} from './schema';
import { sceneDurationFrames } from './timeline';

function resolved(doc: CompositionDocument) {
  return {
    id: doc.id,
    width: doc.width ?? COMPOSITION_DOCUMENT_DEFAULTS.width,
    height: doc.height ?? COMPOSITION_DOCUMENT_DEFAULTS.height,
    fps: doc.fps ?? COMPOSITION_DOCUMENT_DEFAULTS.fps,
    backgroundColor: doc.backgroundColor ?? COMPOSITION_DOCUMENT_DEFAULTS.backgroundColor,
    lockToAudio: doc.lockToAudio ?? COMPOSITION_DOCUMENT_DEFAULTS.lockToAudio,
    transitionDuration:
      doc.transitionDuration ?? COMPOSITION_DOCUMENT_DEFAULTS.transitionDuration,
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

function compileGenericPlaceholder(scene: SceneSpec, componentName: string): string {
  const annotations =
    'annotations' in scene ? serializeAnnotations(scene.annotations) : '[]';
  return `function ${componentName}() {
  return (
    <TechnicalScene width={W} height={H} annotations={${annotations}}>
      <AnnotationTarget id=${JSON.stringify(scene.id)} style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
        <div style={{ fontSize: 28, color: '#94a3b8' }}>
          {${JSON.stringify(scene.type)}} scene placeholder
        </div>
      </AnnotationTarget>
    </TechnicalScene>
  );
}`;
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
    default:
      return compileGenericPlaceholder(scene, componentName);
  }
}

function sceneDurationFramesForCompile(scene: SceneSpec): number {
  return sceneDurationFrames(scene);
}

export interface CompileCompositionResult {
  code: string;
}

export function compileCompositionDocumentToTsx(
  doc: CompositionDocument
): CompileCompositionResult {
  const r = resolved(doc);
  const sceneNames = doc.scenes.map((scene, index) =>
    sceneComponentName(scene.id, index)
  );

  const usesWhiteboard = doc.scenes.some((scene) => scene.type === 'whiteboard');
  const usesTechnical = doc.scenes.some((scene) => scene.type !== 'whiteboard') ||
    doc.scenes.some((scene) => scene.annotations && scene.annotations.length > 0);

  const sceneFns = doc.scenes
    .map((scene, index) => compileSceneComponent(scene, sceneNames[index], r))
    .join('\n\n');

  const narratedScenes = doc.scenes.filter(
    (scene) => scene.narration && scene.narration.trim().length > 0
  );
  const hasNarration = narratedScenes.length > 0;

  const sceneDurations = doc.scenes.map(sceneDurationFramesForCompile);
  const totalDuration =
    sceneDurations.reduce((sum, d) => sum + d, 0) +
    Math.max(0, doc.scenes.length - 1) * r.transitionDuration;

  const sceneTree = doc.scenes
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

  const narrationCues = narratedScenes
    .map(
      (scene) =>
        `      {\n        id: ${JSON.stringify(scene.id)},\n        sceneId: ${JSON.stringify(scene.id)},\n        text: ${JSON.stringify(scene.narration)},\n      },`
    )
    .join('\n');

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
} from '@seqvio/technical';`
    : '';

  const styleBlock = usesWhiteboard
    ? `const STYLE_ID = ${JSON.stringify(r.styleId)};
const STYLE = getSeqvioStylePreset(STYLE_ID) ?? {
  texture: ${JSON.stringify(r.texture)},
  background: ${JSON.stringify(r.backgroundColor)},
  theme: excalidrawTheme,
};`
    : '';

  const code = `// AUTO-GENERATED from a Seqvio CompositionDocument v2. Safe to edit by hand.
import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene, Transition } from '@seqvio/core';
${whiteboardImports}
${technicalImports}

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
  audio: {
    fps: FPS,
    lockToAudio: ${r.lockToAudio},
    narration: [
${narrationCues}
    ],
  },
};`
    : `export const meta: RenderableMeta = {
  fps: FPS,
  duration: ${totalDuration},
  width: W,
  height: H,
};`
}
`;

  return { code };
}
