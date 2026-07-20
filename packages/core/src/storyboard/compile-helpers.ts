/**
 * Shared helpers for storyboard and composition-document compilers.
 */

import type { StoryboardElement, StoryboardScene } from './schema';

export const SCENE_TAIL_PAD = 18;

export function sceneComponentName(sceneId: string, index: number): string {
  const cleaned = sceneId.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  const pascal = cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const safe = /^[A-Za-z]/.test(pascal) ? pascal : `Scene${pascal}`;
  return `${safe || 'Scene'}Scene${index}`;
}

export function pascalId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  const pascal = cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return /^[A-Za-z]/.test(pascal) ? pascal : `Composition${pascal}`;
}

export function jsxAttr(
  name: string,
  value: string | number | boolean | undefined
): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return ` ${name}={${JSON.stringify(value)}}`;
  if (typeof value === 'boolean') return value ? ` ${name}` : '';
  return ` ${name}={${value}}`;
}

export function vecAttr(
  name: string,
  value: { x: number; y: number } | undefined
): string {
  if (!value) return '';
  return ` ${name}={{ x: ${value.x}, y: ${value.y} }}`;
}

export function sizeAttr(
  value: number | { width: number; height: number } | undefined
): string {
  if (value === undefined) return '';
  if (typeof value === 'number') return ` size={${value}}`;
  return ` size={{ width: ${value.width}, height: ${value.height} }}`;
}

export function commonDrawAttrs(el: StoryboardElement): string {
  return (
    jsxAttr('start', el.start ?? 0) +
    jsxAttr('duration', el.duration ?? 30) +
    jsxAttr('easing', el.easing) +
    jsxAttr('strokeColor', el.strokeColor) +
    jsxAttr('strokeWidth', el.strokeWidth) +
    jsxAttr('fillColor', el.fillColor)
  );
}

export function compileElement(el: StoryboardElement): string {
  switch (el.type) {
    case 'text':
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
    case 'shape':
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
    case 'image':
      return (
        `      <DrawImage` +
        jsxAttr('src', el.src) +
        vecAttr('position', el.position) +
        (el.size ? ` size={{ width: ${el.size.width}, height: ${el.size.height} }}` : '') +
        commonDrawAttrs(el) +
        ` />`
      );
    case 'icon':
      return (
        `      <DrawIcon` +
        jsxAttr('name', el.name) +
        vecAttr('position', el.position) +
        jsxAttr('size', el.size) +
        commonDrawAttrs(el) +
        ` />`
      );
  }
}

export function compileWhiteboardSceneBody(
  scene: StoryboardScene,
  _board: { texture: string; backgroundColor: string }
): string {
  return scene.elements.map(compileElement).join('\n');
}

export function sceneDurationFramesFromElements(
  elements: StoryboardElement[],
  explicitDuration?: number
): number {
  if (typeof explicitDuration === 'number' && explicitDuration > 0) {
    return explicitDuration;
  }
  let maxEnd = 0;
  for (const el of elements) {
    const end = (el.start ?? 0) + (el.duration ?? 30);
    if (end > maxEnd) maxEnd = end;
  }
  return Math.max(1, maxEnd + SCENE_TAIL_PAD);
}
