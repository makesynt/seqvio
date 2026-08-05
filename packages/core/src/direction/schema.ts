import type { ExplainerDocument } from '../explainer-document/schema';

export const DIRECTION_PLAN_FORMAT = 'seqvio-direction-plan' as const;
export const DIRECTION_PLAN_VERSION = '1.0' as const;

export type DirectionPurpose =
  | 'hook'
  | 'establish-model'
  | 'explain-mechanism'
  | 'demonstrate'
  | 'summarize';
export type DirectionPace = 'hold' | 'steady' | 'build' | 'resolve';
export type DirectionFocus = 'overview' | 'target' | 'sequence' | 'result';
export type DirectionCamera = 'overview' | 'follow-target' | 'focus-transfer' | 'hold';
export type DirectionTransition = 'cut' | 'crossfade' | 'focus-transfer' | 'match-object';

export interface DirectionFocusSpec {
  targetId?: string;
  targetIds?: string[];
  beatId?: string;
  captureStepId?: string;
}

export interface DirectionSegment {
  id: string;
  sceneId: string;
  purpose: DirectionPurpose;
  pace?: DirectionPace;
  focus?: DirectionFocus;
  focusSpec?: DirectionFocusSpec;
  camera?: DirectionCamera;
  transition?: DirectionTransition;
  transitionTargetId?: string;
}

export interface DirectionPlan {
  format: typeof DIRECTION_PLAN_FORMAT;
  version: typeof DIRECTION_PLAN_VERSION;
  id: string;
  segments: DirectionSegment[];
}

export interface DirectionPlanIssue {
  severity: 'error' | 'warning';
  code: string;
  path: string;
  message: string;
}

export interface CompiledDirectionPlan {
  sceneActions: Array<{
    segmentId: string;
    sceneId: string;
    purpose: DirectionPurpose;
    pace?: DirectionPace;
    camera?: DirectionCamera;
    transition?: DirectionTransition;
  }>;
  attention: Array<{
    segmentId: string;
    sceneId: string;
    targetId: string;
    sourceBeatId?: string;
    sourceCaptureStepId?: string;
    start: number;
    duration: number;
  }>;
  timingHints: Array<{ segmentId: string; pace: DirectionPace; minHoldFrames: number }>;
}

export type DirectionDocument = Pick<ExplainerDocument, 'scenes'>;
