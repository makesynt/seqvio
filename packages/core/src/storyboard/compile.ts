/**
 * Storyboard IR -> whiteboard TSX source compiler.
 *
 * Emits TSX source text so @seqvio/core stays free of React style-package
 * imports while generated compositions remain editable and diffable.
 */

import {
  STORYBOARD_DEFAULTS,
  type Storyboard,
  type StoryboardScene,
} from './schema';
import {
  compileWhiteboardSceneBody,
  pascalId,
  sceneComponentName,
  sceneDurationFramesFromElements,
} from './compile-helpers';

function resolved(board: Storyboard) {
  return {
    id: board.id,
    width: board.width ?? STORYBOARD_DEFAULTS.width,
    height: board.height ?? STORYBOARD_DEFAULTS.height,
    fps: board.fps ?? STORYBOARD_DEFAULTS.fps,
    styleId: board.styleId ?? STORYBOARD_DEFAULTS.styleId,
    density: board.density ?? STORYBOARD_DEFAULTS.density,
    backgroundColor: board.backgroundColor ?? STORYBOARD_DEFAULTS.backgroundColor,
    texture: board.texture ?? STORYBOARD_DEFAULTS.texture,
    lockToAudio: board.lockToAudio ?? STORYBOARD_DEFAULTS.lockToAudio,
    transitionDuration:
      board.transitionDuration ?? STORYBOARD_DEFAULTS.transitionDuration,
  };
}

function compileWhiteboardScene(
  scene: StoryboardScene,
  componentName: string,
  board: ReturnType<typeof resolved>
): string {
  const elements = compileWhiteboardSceneBody(scene, board);
  return `function ${componentName}() {
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture={STYLE.texture ?? ${JSON.stringify(board.texture)}}
      background={STYLE.background}
      theme={STYLE.theme ?? excalidrawTheme}
    >
${elements}
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}`;
}

function sceneDurationFrames(scene: StoryboardScene): number {
  return sceneDurationFramesFromElements(scene.elements, scene.duration);
}

export interface CompileStoryboardOptions {}

export interface CompileResult {
  /** Generated TSX source text. */
  code: string;
}

/**
 * Compile a validated storyboard into TSX source text. Callers should run
 * validateStoryboard / assertValidStoryboard first.
 */
export function compileStoryboardToTsx(
  board: Storyboard,
  _options: CompileStoryboardOptions = {}
): CompileResult {
  const r = resolved(board);
  const sceneNames = board.scenes.map((scene, index) =>
    sceneComponentName(scene.id, index)
  );

  const sceneFns = board.scenes
    .map((scene, index) => compileWhiteboardScene(scene, sceneNames[index], r))
    .join('\n\n');

  const narratedScenes = board.scenes.filter(
    (scene) => scene.narration && scene.narration.trim().length > 0
  );
  const hasNarration = narratedScenes.length > 0;

  const sceneDurations = board.scenes.map(sceneDurationFrames);
  const totalDuration =
    sceneDurations.reduce((sum, d) => sum + d, 0) +
    Math.max(0, board.scenes.length - 1) * r.transitionDuration;

  const sceneTree = board.scenes
    .map((scene, index) => {
      const durationAttr = ` duration={${sceneDurations[index]}}`;
      const tag = `      <Scene id=${JSON.stringify(scene.id)}${durationAttr}>\n        <${sceneNames[index]} />\n      </Scene>`;
      const needsTransition = index < board.scenes.length - 1 && r.transitionDuration > 0;
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

  const code = `// AUTO-GENERATED from a Seqvio storyboard. Safe to edit by hand.
import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene, Transition } from '@seqvio/core';
import {
  DrawShape,
  DrawText,
  DrawImage,
  DrawIcon,
  Hand,
  WhiteboardScene,
  excalidrawTheme,
  getSeqvioStylePreset,
} from '@seqvio/whiteboard';

const W = ${r.width};
const H = ${r.height};
const FPS = ${r.fps};
const STYLE_ID = ${JSON.stringify(r.styleId)};
const STYLE = getSeqvioStylePreset(STYLE_ID) ?? {
  texture: ${JSON.stringify(r.texture)},
  background: ${JSON.stringify(r.backgroundColor)},
  theme: excalidrawTheme,
};

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
