/**
 * Scene registry – computes global frame ranges for Scene and Transition children.
 */

import React from 'react';
import type { CompositionAudioManifest } from './audio';
import { resolveSceneDurationFrames } from './time';

export interface SceneRegistration {
  id: string;
  duration: number;
  globalStart: number;
  globalEnd: number;
  order: number;
}

export interface TransitionRegistration {
  type: string;
  duration: number;
  globalStart: number;
  globalEnd: number;
  afterSceneId: string | null;
  beforeSceneId: string | null;
  order: number;
  options?: Record<string, unknown>;
}

export interface CompositionLayout {
  scenes: SceneRegistration[];
  transitions: TransitionRegistration[];
  totalDuration: number;
}

const DEFAULT_TRANSITION_DURATION = 15;

interface SceneElementProps {
  id: string;
  duration?: number;
}

interface TransitionElementProps {
  type?: string;
  duration?: number;
  options?: Record<string, unknown>;
}

function getChildTypeName(child: React.ReactElement): string {
  const type = child.type as { displayName?: string; name?: string };
  return type.displayName || type.name || '';
}

export function isSceneElement(child: React.ReactElement): boolean {
  return getChildTypeName(child) === 'Scene';
}

export function isTransitionElement(child: React.ReactElement): boolean {
  return getChildTypeName(child) === 'Transition';
}

export function buildCompositionLayout(
  children: React.ReactNode,
  defaultTransitionDuration = DEFAULT_TRANSITION_DURATION,
  options?: {
    audioManifest?: CompositionAudioManifest;
    fps?: number;
  }
): CompositionLayout {
  const childArray = React.Children.toArray(children).filter(
    React.isValidElement
  ) as React.ReactElement[];

  const scenes: SceneRegistration[] = [];
  const transitions: TransitionRegistration[] = [];
  let cursor = 0;
  let order = 0;
  let lastSceneId: string | null = null;
  let pendingTransition: TransitionRegistration | null = null;

  for (const child of childArray) {
    if (isTransitionElement(child)) {
      const props = child.props as TransitionElementProps;
      const duration = Number(props.duration) || defaultTransitionDuration;
      pendingTransition = {
        type: String(props.type || 'fade'),
        duration,
        globalStart: cursor,
        globalEnd: cursor + duration,
        afterSceneId: lastSceneId,
        beforeSceneId: null,
        order: order++,
        options: props.options,
      };
      cursor += duration;
      transitions.push(pendingTransition);
      continue;
    }

    if (!isSceneElement(child)) {
      continue;
    }

    const props = child.props as SceneElementProps;
    const id = String(props.id);
    const authoredDuration = Number(props.duration);
    const duration =
      Number.isFinite(authoredDuration) && authoredDuration > 0
        ? authoredDuration
        : resolveSceneDurationFrames(
            id,
            Math.max(1, options?.fps ?? options?.audioManifest?.fps ?? 30),
            options?.audioManifest
          ) ?? 0;
    if (duration <= 0) {
      throw new Error(
        `Scene "${id}" is missing a valid duration and no audio-aligned duration could be derived.`
      );
    }
    if (pendingTransition) {
      pendingTransition.beforeSceneId = id;
      pendingTransition = null;
    }

    scenes.push({
      id,
      duration,
      globalStart: cursor,
      globalEnd: cursor + duration,
      order: order++,
    });
    lastSceneId = id;
    cursor += duration;
  }

  return {
    scenes,
    transitions,
    totalDuration: cursor,
  };
}

export function getSceneAtFrame(
  layout: CompositionLayout,
  frame: number
): SceneRegistration | null {
  return (
    layout.scenes.find(
      (scene) => frame >= scene.globalStart && frame < scene.globalEnd
    ) ?? null
  );
}

export function getActiveTransitionAtFrame(
  layout: CompositionLayout,
  frame: number
): TransitionRegistration | null {
  return (
    layout.transitions.find(
      (transition) => frame >= transition.globalStart && frame < transition.globalEnd
    ) ?? null
  );
}

export function getSceneRegistration(
  layout: CompositionLayout,
  sceneId: string
): SceneRegistration | undefined {
  return layout.scenes.find((scene) => scene.id === sceneId);
}
