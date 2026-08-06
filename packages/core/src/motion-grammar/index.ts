import type { AttentionSequenceItem } from '../annotation';
import type { ExplainerDocument, VisualBeatAction } from '../explainer-document/schema';
import type { DirectionSegment } from '../direction';

export const MOTION_GRAMMAR_FORMAT = 'seqvio-motion-grammar' as const;
export const MOTION_GRAMMAR_VERSION = '1.0' as const;
export type MotionGrammarAction = 'question' | 'pause' | 'reveal' | 'trace' | 'compare' | 'emphasize' | 'transform' | 'answer' | 'summarize';

export interface MotionGrammarStep {
  id: string;
  sceneId: string;
  action: MotionGrammarAction;
  targetId?: string;
  relatedTargetId?: string;
  pathTargetIds?: string[];
  beatId?: string;
  startFrame?: number;
  holdFrames?: number;
}

export interface MotionGrammar {
  format: typeof MOTION_GRAMMAR_FORMAT;
  version: typeof MOTION_GRAMMAR_VERSION;
  id: string;
  steps: MotionGrammarStep[];
}

export interface MotionGrammarIssue { severity: 'error' | 'warning'; code: string; path: string; message: string }
export interface CompiledMotionGrammar {
  visuals: Array<{ stepId: string; sceneId: string; beatId?: string; visual: VisualBeatAction }>;
  attention: AttentionSequenceItem[];
  direction: DirectionSegment[];
}

const ACTIONS = new Set<MotionGrammarAction>(['question', 'pause', 'reveal', 'trace', 'compare', 'emphasize', 'transform', 'answer', 'summarize']);
const TARGET_OPTIONAL = new Set<MotionGrammarAction>(['question', 'pause', 'answer', 'summarize']);

function targetsForScene(document: ExplainerDocument, sceneId: string): Set<string> {
  const plan = document.scenes.find((scene) => scene.id === sceneId);
  if (!plan) return new Set();
  const ids = new Set<string>([sceneId]);
  const add = (id: string | undefined) => { if (id) ids.add(id); };
  if (plan.type === 'whiteboard') plan.elements.forEach((item) => add(item.id));
  if (plan.type === 'code' || plan.type === 'diagram') plan.steps.forEach((item) => add(item.id));
  if (plan.type === 'diagram') { plan.nodes.forEach((item) => add(item.id)); plan.edges.forEach((item) => add(item.id)); }
  if (plan.type === 'infographic') {
    [...(plan.metrics ?? []), ...(plan.comparisons ?? []), ...(plan.process ?? []), ...(plan.timeline ?? []), ...(plan.relationshipNodes ?? []), ...(plan.relationships ?? []), ...(plan.charts ?? [])].forEach((item) => add(item.id));
    (plan.charts ?? []).forEach((chart) => chart.series.forEach((series) => add(series.id)));
  }
  if (plan.type === 'terminal' || plan.type === 'browser') (plan.steps ?? []).forEach((item) => add(item.id));
  if (plan.type === 'manim') (plan.markers ?? []).forEach((item) => { add(item.id); add(item.targetId); });
  return ids;
}

export function validateMotionGrammar(input: unknown, document?: ExplainerDocument): MotionGrammarIssue[] {
  const issues: MotionGrammarIssue[] = [];
  const add = (path: string, code: string, message: string) => issues.push({ severity: 'error' as const, path, code, message });
  if (!input || typeof input !== 'object') return [{ severity: 'error', path: '$', code: 'invalid_motion_grammar', message: 'MotionGrammar must be an object' }];
  const grammar = input as Partial<MotionGrammar>;
  if (grammar.format !== MOTION_GRAMMAR_FORMAT) add('format', 'unsupported_motion_grammar_format', `format must be "${MOTION_GRAMMAR_FORMAT}"`);
  if (grammar.version !== MOTION_GRAMMAR_VERSION) add('version', 'unsupported_motion_grammar_version', `version must be "${MOTION_GRAMMAR_VERSION}"`);
  if (!Array.isArray(grammar.steps) || grammar.steps.length === 0) { add('steps', 'missing_motion_steps', 'steps must be non-empty'); return issues; }
  const ids = new Set<string>();
  grammar.steps.forEach((step, index) => {
    const path = `steps[${index}]`;
    if (!step?.id) add(`${path}.id`, 'missing_motion_step_id', 'step id is required'); else if (ids.has(step.id)) add(`${path}.id`, 'duplicate_motion_step_id', `Duplicate step id "${step.id}"`); else ids.add(step.id);
    if (!ACTIONS.has(step.action)) add(`${path}.action`, 'unsupported_motion_action', `Unsupported action "${step.action}"`);
    const targets = document ? targetsForScene(document, step.sceneId) : undefined;
    if (document && targets?.size === 0) add(`${path}.sceneId`, 'unknown_motion_scene', `Unknown scene "${step.sceneId}"`);
    if (!TARGET_OPTIONAL.has(step.action) && !step.targetId) add(`${path}.targetId`, 'missing_motion_target', `Action "${step.action}" requires a target`);
    for (const target of [step.targetId, step.relatedTargetId, ...(step.pathTargetIds ?? [])]) if (target && targets && !targets.has(target)) add(`${path}.targetId`, 'unknown_motion_target', `Unknown target "${target}" in scene "${step.sceneId}"`);
    if (step.action === 'compare' && !step.relatedTargetId) add(`${path}.relatedTargetId`, 'missing_compare_relation', 'compare requires relatedTargetId');
    if (step.action === 'trace' && (!Array.isArray(step.pathTargetIds) || step.pathTargetIds.length < 2)) add(`${path}.pathTargetIds`, 'missing_trace_path', 'trace requires at least two pathTargetIds');
    if (step.startFrame !== undefined && (!Number.isInteger(step.startFrame) || step.startFrame < 0)) add(`${path}.startFrame`, 'invalid_motion_start', 'startFrame must be a non-negative integer');
    if (step.holdFrames !== undefined && (!Number.isInteger(step.holdFrames) || step.holdFrames <= 0)) add(`${path}.holdFrames`, 'invalid_motion_hold', 'holdFrames must be a positive integer');
  });
  return issues;
}

export function compileMotionGrammar(grammar: MotionGrammar): CompiledMotionGrammar {
  const visuals: CompiledMotionGrammar['visuals'] = [];
  const attention: AttentionSequenceItem[] = [];
  const direction: DirectionSegment[] = [];
  grammar.steps.forEach((step, index) => {
    const visualAction: VisualBeatAction['action'] = ['reveal', 'trace', 'compare', 'emphasize', 'transform'].includes(step.action) ? step.action as VisualBeatAction['action'] : 'focus';
    if (step.targetId) visuals.push({ stepId: step.id, sceneId: step.sceneId, beatId: step.beatId, visual: { targetId: step.targetId, action: visualAction, relatedTargetId: step.relatedTargetId, pathTargetIds: step.pathTargetIds } });
    if (step.targetId && step.action !== 'reveal') attention.push({ id: step.id, sceneId: step.sceneId, targetId: step.targetId, toTargetId: step.relatedTargetId, pathTargetIds: step.pathTargetIds, kind: step.action === 'compare' ? 'connector' : step.action === 'trace' ? 'guided-path' : 'focus-ring', start: step.startFrame ?? index * 30, duration: step.holdFrames ?? 24, sourceBeatId: step.beatId, persistence: 'timed' });
    direction.push({ id: step.id, sceneId: step.sceneId, purpose: step.action === 'question' ? 'hook' : step.action === 'answer' || step.action === 'summarize' ? 'summarize' : 'explain-mechanism', pace: step.action === 'pause' ? 'hold' : 'steady', focus: step.targetId ? 'target' : 'overview', focusSpec: step.targetId ? { targetId: step.targetId, beatId: step.beatId } : undefined, camera: step.targetId ? 'follow-target' : 'hold', transition: 'cut' });
  });
  return { visuals, attention, direction };
}
