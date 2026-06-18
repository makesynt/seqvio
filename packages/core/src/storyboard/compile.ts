/**
 * Storyboard IR -> whiteboard TSX source compiler.
 *
 * Emits TSX source text so @seqvio/core stays free of React style-package
 * imports while generated compositions remain editable and diffable.
 */

import {
  STORYBOARD_DEFAULTS,
  type IconElement,
  type ImageElement,
  type ShapeElement,
  type Size,
  type Storyboard,
  type StoryboardElement,
  type StoryboardScene,
  type TextElement,
  type Vec2,
} from './schema';

function resolved(board: Storyboard) {
  return {
    id: board.id,
    width: board.width ?? STORYBOARD_DEFAULTS.width,
    height: board.height ?? STORYBOARD_DEFAULTS.height,
    fps: board.fps ?? STORYBOARD_DEFAULTS.fps,
    backgroundColor: board.backgroundColor ?? STORYBOARD_DEFAULTS.backgroundColor,
    texture: board.texture ?? STORYBOARD_DEFAULTS.texture,
    lockToAudio: board.lockToAudio ?? STORYBOARD_DEFAULTS.lockToAudio,
    transitionDuration:
      board.transitionDuration ?? STORYBOARD_DEFAULTS.transitionDuration,
  };
}

/** PascalCase component name derived from a scene id. */
function sceneComponentName(sceneId: string, index: number): string {
  const cleaned = sceneId.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  const pascal = cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const safe = /^[A-Za-z]/.test(pascal) ? pascal : `Scene${pascal}`;
  return `${safe || 'Scene'}Scene${index}`;
}

function jsxAttr(name: string, value: string | number | boolean | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return ` ${name}={${JSON.stringify(value)}}`;
  if (typeof value === 'boolean') return value ? ` ${name}` : '';
  return ` ${name}={${value}}`;
}

function vecAttr(name: string, value: Vec2 | undefined): string {
  if (!value) return '';
  return ` ${name}={{ x: ${value.x}, y: ${value.y} }}`;
}

function sizeAttr(value: number | Size | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'number') return ` size={${value}}`;
  return ` size={{ width: ${value.width}, height: ${value.height} }}`;
}

function commonDrawAttrs(el: StoryboardElement): string {
  return (
    jsxAttr('start', el.start ?? 0) +
    jsxAttr('duration', el.duration ?? 30) +
    jsxAttr('easing', el.easing) +
    jsxAttr('strokeColor', el.strokeColor) +
    jsxAttr('strokeWidth', el.strokeWidth) +
    jsxAttr('fillColor', el.fillColor)
  );
}

function compileText(el: TextElement): string {
  return (
    `      <DrawText` +
    jsxAttr('text', el.text) +
    vecAttr('position', el.position) +
    jsxAttr('fontSize', el.fontSize) +
    jsxAttr('fontWeight', el.fontWeight) +
    jsxAttr('align', el.align) +
    commonDrawAttrs(el) +
    ` />`
  );
}

function compileShape(el: ShapeElement): string {
  return (
    `      <DrawShape` +
    jsxAttr('type', el.shape) +
    vecAttr('position', el.position) +
    sizeAttr(el.size) +
    vecAttr('from', el.from) +
    vecAttr('to', el.to) +
    jsxAttr('borderRadius', el.borderRadius) +
    commonDrawAttrs(el) +
    ` />`
  );
}

function compileImage(el: ImageElement): string {
  return (
    `      <DrawImage` +
    jsxAttr('src', el.src) +
    vecAttr('position', el.position) +
    (el.size ? ` size={{ width: ${el.size.width}, height: ${el.size.height} }}` : '') +
    commonDrawAttrs(el) +
    ` />`
  );
}

function compileIcon(el: IconElement): string {
  return (
    `      <DrawIcon` +
    jsxAttr('name', el.name) +
    vecAttr('position', el.position) +
    jsxAttr('size', el.size) +
    commonDrawAttrs(el) +
    ` />`
  );
}

function compileElement(el: StoryboardElement): string {
  switch (el.type) {
    case 'text':
      return compileText(el);
    case 'shape':
      return compileShape(el);
    case 'image':
      return compileImage(el);
    case 'icon':
      return compileIcon(el);
  }
}

function compileWhiteboardScene(
  scene: StoryboardScene,
  componentName: string,
  board: ReturnType<typeof resolved>
): string {
  const elements = scene.elements.map(compileElement).join('\n');
  return `function ${componentName}() {
  return (
    <WhiteboardScene width={W} height={H} texture=${JSON.stringify(board.texture)} theme={excalidrawTheme}>
${elements}
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}`;
}

const SCENE_TAIL_PAD = 18;

function sceneDurationFrames(scene: StoryboardScene): number {
  if (typeof scene.duration === 'number' && scene.duration > 0) {
    return scene.duration;
  }
  let maxEnd = 0;
  for (const el of scene.elements) {
    const end = (el.start ?? 0) + (el.duration ?? 30);
    if (end > maxEnd) maxEnd = end;
  }
  return Math.max(1, maxEnd + SCENE_TAIL_PAD);
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
} from '@seqvio/whiteboard';

const W = ${r.width};
const H = ${r.height};
const FPS = ${r.fps};

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

function pascalId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  const pascal = cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return /^[A-Za-z]/.test(pascal) ? pascal : `Composition${pascal}`;
}
