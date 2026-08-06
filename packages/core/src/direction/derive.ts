import type { ExplainerDocument, SceneSpec } from '../explainer-document/schema';
import {
  DIRECTION_PLAN_FORMAT,
  DIRECTION_PLAN_VERSION,
  type DirectionCamera,
  type DirectionPace,
  type DirectionPlan,
  type DirectionPurpose,
  type DirectionSegment,
} from './schema';

function purposeFor(scene: SceneSpec, index: number, count: number): DirectionPurpose {
  if (index === 0 && count > 1) return 'hook';
  if (index === count - 1 && count > 1) return 'summarize';
  if (scene.type === 'terminal' || scene.type === 'browser') return 'demonstrate';
  return index === 0 ? 'establish-model' : 'explain-mechanism';
}

function paceFor(targetCount: number, minHoldMs: number): DirectionPace {
  if (minHoldMs >= 1000) return 'hold';
  if (targetCount > 1) return 'build';
  return 'steady';
}

function cameraFor(targetCount: number): DirectionCamera {
  if (targetCount === 0) return 'overview';
  if (targetCount === 1) return 'follow-target';
  return 'focus-transfer';
}

/** Derive direction only from semantic ids already owned by the document. */
export function deriveDirectionPlan(document: ExplainerDocument): DirectionPlan {
  const segments = document.scenes.flatMap<DirectionSegment>((scene, sceneIndex) => {
    const beats = scene.explanation?.beats ?? [];
    if (beats.length === 0) {
      return [{
        id: `${scene.id}.overview`, sceneId: scene.id,
        purpose: purposeFor(scene, sceneIndex, document.scenes.length),
        pace: 'steady' as const, focus: 'overview' as const,
        camera: 'overview' as const, transition: 'cut' as const,
      }];
    }
    return beats.map((beat, beatIndex) => {
      const targetIds = [...new Set(beat.visuals.map((visual) => visual.targetId))];
      const minHoldMs = Math.max(0, ...beat.visuals.map((visual) => visual.minHoldMs ?? 0));
      return {
        id: `${scene.id}.${beat.id}`, sceneId: scene.id,
        purpose: purposeFor(scene, sceneIndex, document.scenes.length),
        pace: paceFor(targetIds.length, minHoldMs),
        focus: targetIds.length > 1 ? 'sequence' as const : 'target' as const,
        focusSpec: { targetIds, beatId: beat.id, captureStepId: beat.evidence?.captureStepId },
        camera: cameraFor(targetIds.length),
        transition: beatIndex === beats.length - 1 ? 'cut' as const : undefined,
      };
    });
  });
  return { format: DIRECTION_PLAN_FORMAT, version: DIRECTION_PLAN_VERSION, id: `${document.id}.direction`, segments };
}
