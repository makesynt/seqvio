import type { SceneSpec } from '../explainer-document/schema';
import {
  DIRECTION_PLAN_FORMAT,
  DIRECTION_PLAN_VERSION,
  type DirectionDocument,
  type DirectionPlan,
  type DirectionPlanIssue,
} from './schema';

const PURPOSES = new Set(['hook', 'establish-model', 'explain-mechanism', 'demonstrate', 'summarize']);
const PACES = new Set(['hold', 'steady', 'build', 'resolve']);
const FOCUSES = new Set(['overview', 'target', 'sequence', 'result']);
const CAMERAS = new Set(['overview', 'follow-target', 'focus-transfer', 'hold']);
const TRANSITIONS = new Set(['cut', 'crossfade', 'focus-transfer', 'match-object']);

function issue(issues: DirectionPlanIssue[], path: string, code: string, message: string, severity: 'error' | 'warning' = 'error') {
  issues.push({ severity, path, code, message });
}

function sceneTargets(scene: SceneSpec): Set<string> {
  const ids = new Set<string>();
  const add = (value: unknown) => { if (typeof value === 'string' && value) ids.add(value); };
  add(scene.id);
  if (scene.type === 'diagram') { scene.nodes.forEach((n) => add(n.id)); scene.edges.forEach((e) => add(e.id)); scene.steps.forEach((s) => add(s.id)); }
  if (scene.type === 'whiteboard') scene.elements.forEach((e) => add(e.id));
  if (scene.type === 'code') scene.steps.forEach((s) => add(s.id));
  if (scene.type === 'infographic') [...(scene.metrics ?? []), ...(scene.comparisons ?? []), ...(scene.process ?? []), ...(scene.timeline ?? []), ...(scene.relationshipNodes ?? []), ...(scene.relationships ?? []), ...(scene.charts ?? [])].forEach((item) => add(item.id));
  if (scene.type === 'terminal' || scene.type === 'browser') (scene.steps ?? []).forEach((s) => add(s.id));
  if (scene.type === 'manim') (scene.markers ?? []).forEach((marker) => { add(marker.id); add(marker.targetId); });
  return ids;
}

export function validateDirectionPlan(input: unknown, document?: DirectionDocument): DirectionPlanIssue[] {
  const issues: DirectionPlanIssue[] = [];
  if (!input || typeof input !== 'object') { issue(issues, '$', 'expected_plan_object', 'DirectionPlan must be an object'); return issues; }
  const plan = input as Partial<DirectionPlan>;
  if (plan.format !== DIRECTION_PLAN_FORMAT) issue(issues, 'format', 'unsupported_direction_format', `format must be "${DIRECTION_PLAN_FORMAT}"`);
  if (plan.version !== DIRECTION_PLAN_VERSION) issue(issues, 'version', 'unsupported_direction_version', `version must be "${DIRECTION_PLAN_VERSION}"`);
  if (typeof plan.id !== 'string' || !plan.id) issue(issues, 'id', 'missing_direction_id', 'id must be a non-empty string');
  if (!Array.isArray(plan.segments) || plan.segments.length === 0) { issue(issues, 'segments', 'missing_direction_segments', 'segments must be a non-empty array'); return issues; }

  const sceneMap = new Map<string, Set<string>>((document?.scenes ?? []).map((scene) => [scene.id, sceneTargets(scene)]));
  const beatMap = new Map((document?.scenes ?? []).map((scene) => [scene.id, new Set((scene.explanation?.beats ?? []).map((beat) => beat.id))]));
  const captureStepMap = new Map((document?.scenes ?? []).map((scene) => [
    scene.id,
    new Set(scene.type === 'terminal' || scene.type === 'browser' ? (scene.steps ?? []).map((step) => step.id) : []),
  ]));
  const segmentIds = new Set<string>();
  plan.segments.forEach((segment, index) => {
    const path = `segments[${index}]`;
    if (!segment || typeof segment !== 'object') { issue(issues, path, 'invalid_direction_segment', `${path} must be an object`); return; }
    if (typeof segment.id !== 'string' || !segment.id) issue(issues, `${path}.id`, 'missing_direction_segment_id', 'segment id is required');
    else if (segmentIds.has(segment.id)) issue(issues, `${path}.id`, 'duplicate_direction_segment_id', `Duplicate segment id "${segment.id}"`); else segmentIds.add(segment.id);
    if (typeof segment.sceneId !== 'string' || !segment.sceneId) issue(issues, `${path}.sceneId`, 'missing_direction_scene', 'sceneId is required');
    const targets = sceneMap.get(segment.sceneId ?? '');
    if (document && !targets) issue(issues, `${path}.sceneId`, 'unknown_direction_scene', `Unknown scene id "${segment.sceneId}"`);
    if (!PURPOSES.has(String(segment.purpose))) issue(issues, `${path}.purpose`, 'unsupported_direction_purpose', `Unsupported purpose "${segment.purpose}"`);
    if (segment.pace !== undefined && !PACES.has(segment.pace)) issue(issues, `${path}.pace`, 'unsupported_direction_pace', `Unsupported pace "${segment.pace}"`);
    if (segment.focus !== undefined && !FOCUSES.has(segment.focus)) issue(issues, `${path}.focus`, 'unsupported_direction_focus', `Unsupported focus "${segment.focus}"`);
    if (segment.camera !== undefined && !CAMERAS.has(segment.camera)) issue(issues, `${path}.camera`, 'unsupported_direction_camera', `Unsupported camera "${segment.camera}"`);
    if (segment.transition !== undefined && !TRANSITIONS.has(segment.transition)) issue(issues, `${path}.transition`, 'unsupported_direction_transition', `Unsupported transition "${segment.transition}"`);
    const focus = segment.focusSpec;
    const focusIds = [...(focus?.targetIds ?? []), ...(focus?.targetId ? [focus.targetId] : [])];
    if (targets) focusIds.forEach((targetId) => { if (!targets.has(targetId)) issue(issues, `${path}.focusSpec`, 'unknown_direction_target', `Unknown target id "${targetId}" in scene "${segment.sceneId}"`); });
    if (targets && segment.transitionTargetId && !targets.has(segment.transitionTargetId)) issue(issues, `${path}.transitionTargetId`, 'unknown_direction_transition_target', `Unknown transition target id "${segment.transitionTargetId}" in scene "${segment.sceneId}"`);
    if (focus?.beatId && !beatMap.get(segment.sceneId ?? '')?.has(focus.beatId)) issue(issues, `${path}.focusSpec.beatId`, 'unknown_direction_beat', `Unknown ExplanationBeat id "${focus.beatId}" in scene "${segment.sceneId}"`);
    if (focus?.captureStepId && !captureStepMap.get(segment.sceneId ?? '')?.has(focus.captureStepId)) issue(issues, `${path}.focusSpec.captureStepId`, 'unknown_direction_capture_step', `Unknown capture step id "${focus.captureStepId}" in scene "${segment.sceneId}"`);
    if (segment.transition && segment.transition !== 'cut' && !segment.transitionTargetId && focusIds.length === 0) issue(issues, `${path}.transitionTargetId`, 'transition_without_shared_target', 'Non-cut transitions require a shared target or transitionTargetId');
  });
  return issues;
}

export function compileDirectionPlan(plan: DirectionPlan): import('./schema').CompiledDirectionPlan {
  const sceneActions = plan.segments.map((segment) => ({ segmentId: segment.id, sceneId: segment.sceneId, purpose: segment.purpose, pace: segment.pace, camera: segment.camera, transition: segment.transition }));
  const attention: import('./schema').CompiledDirectionPlan['attention'] = [];
  const timingHints: import('./schema').CompiledDirectionPlan['timingHints'] = [];
  plan.segments.forEach((segment, index) => {
    const targets = [...(segment.focusSpec?.targetIds ?? []), ...(segment.focusSpec?.targetId ? [segment.focusSpec.targetId] : [])];
    targets.forEach((targetId) => attention.push({ segmentId: segment.id, sceneId: segment.sceneId, targetId, sourceBeatId: segment.focusSpec?.beatId, sourceCaptureStepId: segment.focusSpec?.captureStepId, start: index, duration: 1 }));
    if (segment.pace) timingHints.push({ segmentId: segment.id, pace: segment.pace, minHoldFrames: segment.pace === 'hold' ? 30 : segment.pace === 'build' ? 12 : 18 });
  });
  return { sceneActions, attention, timingHints };
}
