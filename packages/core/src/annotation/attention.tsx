import React from 'react';
import { AnnotationLayer, type AnnotationItem, type AnnotationKind } from './AnnotationLayer';
import { mapSceneOutputFrameToSource } from '../frame';
import { useCurrentFrame } from '../frame';
import type { AudioSceneTiming } from '../audio';
import { useStyleProfile } from '../style-profile-runtime';

export interface AttentionSequenceItem extends AnnotationItem {
  /** Scene that owns the target. Omit for legacy scene-local sequences. */
  sceneId?: string;
  /** Optional stable id of the next focus target for an explicit handoff. */
  handoffTo?: string;
  /** Minimum visible hold in frames before a handoff may clear this item. */
  minHoldFrames?: number;
  /** Composition-unique ExplanationBeat id that produced this attention item. */
  sourceBeatId?: string;
  /** Controls how long the focus remains active. */
  persistence?: 'timed' | 'until-handoff' | 'until-clear';
  /** Explicit scene-local clear frame, required for until-clear persistence. */
  clearAt?: number;
  /** Destination scene for a cross-scene semantic handoff. */
  handoffToSceneId?: string;
}

export interface ResolvedAttentionItem extends AttentionSequenceItem {
  active: boolean;
  handoff: boolean;
}

export interface AttentionSequenceIssue {
  itemId: string;
  code: 'missing_clear_frame' | 'invalid_clear_frame' | 'unknown_handoff_target';
  message: string;
}

export function validateAttentionSequence(sequence: AttentionSequenceItem[]): AttentionSequenceIssue[] {
  const issues: AttentionSequenceIssue[] = [];
  const targets = new Set(sequence.map((item) => `${item.sceneId ?? ''}:${item.targetId}`));
  for (const item of sequence) {
    if (item.persistence === 'until-clear' && item.clearAt === undefined) {
      issues.push({ itemId: item.id, code: 'missing_clear_frame', message: 'until-clear persistence requires clearAt' });
    } else if (item.clearAt !== undefined && item.clearAt <= item.start) {
      issues.push({ itemId: item.id, code: 'invalid_clear_frame', message: 'clearAt must be greater than start' });
    }
    if (item.handoffTo) {
      const destination = `${item.handoffToSceneId ?? item.sceneId ?? ''}:${item.handoffTo}`;
      if (!targets.has(destination)) {
        issues.push({ itemId: item.id, code: 'unknown_handoff_target', message: `handoff target ${destination} does not exist` });
      }
    }
  }
  return issues;
}

export function resolveAttentionSequence(
  sequence: AttentionSequenceItem[],
  frame: number,
): ResolvedAttentionItem[] {
  return sequence.map((item, index) => {
    const next = sequence[index + 1];
    const timedEnd = item.start + Math.max(item.duration, item.minHoldFrames ?? 0);
    const holdUntil = item.persistence === 'until-clear'
      ? Math.max(item.start, item.clearAt ?? timedEnd)
      : item.persistence === 'until-handoff'
        ? Math.max(item.start, next?.start ?? timedEnd)
        : timedEnd;
    const active = frame >= item.start && frame < holdUntil;
    return {
      ...item,
      active,
      handoff: Boolean(next && item.handoffTo === next.targetId && frame >= next.start),
    };
  });
}

export function selectAttentionForScene(
  sequence: AttentionSequenceItem[],
  sceneId: string,
): AttentionSequenceItem[] {
  return sequence.filter((item) => item.sceneId === undefined || item.sceneId === sceneId);
}

export function resolveAttentionSequenceAtOutputFrame(
  sequence: AttentionSequenceItem[],
  outputFrame: number,
  sourceDuration: number,
  outputDuration: number,
  timeMap?: AudioSceneTiming['timeMap'],
): ResolvedAttentionItem[] {
  const sourceFrame = mapSceneOutputFrameToSource(
    outputFrame,
    sourceDuration,
    outputDuration,
    timeMap,
  );
  return resolveAttentionSequence(sequence, sourceFrame);
}

export interface AttentionSequenceLayerProps {
  sequence: AttentionSequenceItem[];
  sceneId?: string;
}

/** Renders a semantic focus sequence through the shared annotation renderer. */
export const AttentionSequenceLayer: React.FC<AttentionSequenceLayerProps> = ({ sequence, sceneId }) => {
  const frame = useCurrentFrame();
  const styleProfile = useStyleProfile();
  const styledSequence = sequence.map((item) => item.persistence ? item : { ...item, persistence: styleProfile?.attentionPersistence ?? 'timed' });
  const sceneSequence = sceneId ? selectAttentionForScene(styledSequence, sceneId) : styledSequence;
  const active = resolveAttentionSequence(sceneSequence, frame)
    .filter((item) => item.active)
    .map(({ active: _active, handoff: _handoff, ...item }) => item);
  return <AnnotationLayer annotations={active} />;
};

export type AttentionKind = AnnotationKind;
