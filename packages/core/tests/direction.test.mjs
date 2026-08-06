import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileDirectionPlan,
  compileExplainerDocumentToTsx,
  deriveDirectionPlan,
  validateDirectionPlan,
} from '../dist/index.js';

const document = {
  scenes: [{
    type: 'diagram', id: 'flow',
    nodes: [{ id: 'input', label: 'Input' }, { id: 'output', label: 'Output' }],
    edges: [{ id: 'path', from: 'input', to: 'output' }], steps: [],
  }],
};

const plan = {
  format: 'seqvio-direction-plan', version: '1.0', id: 'flow-direction',
  segments: [{
    id: 'explain-flow', sceneId: 'flow', purpose: 'explain-mechanism', pace: 'steady',
    focus: 'sequence', camera: 'focus-transfer', focusSpec: { targetIds: ['input', 'output'] },
    transition: 'cut',
  }],
};

describe('DirectionPlan', () => {
  it('validates and compiles a renderer-agnostic plan', () => {
    assert.deepEqual(validateDirectionPlan(plan, document), []);
    const compiled = compileDirectionPlan(plan);
    assert.deepEqual(compiled.attention.map((item) => item.targetId), ['input', 'output']);
    assert.equal(compiled.sceneActions[0].camera, 'focus-transfer');
  });

  it('rejects unknown targets and targetless transitions', () => {
    const issues = validateDirectionPlan({
      ...plan,
      segments: [{ ...plan.segments[0], focusSpec: undefined, transition: 'match-object' }],
    }, document);
    assert.ok(issues.some((item) => item.code === 'transition_without_shared_target'));
    const targetIssues = validateDirectionPlan({
      ...plan,
      segments: [{ ...plan.segments[0], focusSpec: { targetId: 'missing' } }],
    }, document);
    assert.ok(targetIssues.some((item) => item.code === 'unknown_direction_target'));
  });

  it('pairs source and destination targets for cross-scene transitions', () => {
    const twoSceneDocument = {
      scenes: [
        document.scenes[0],
        { type: 'diagram', id: 'result', nodes: [{ id: 'resolved', label: 'Resolved' }], edges: [], steps: [] },
      ],
    };
    const paired = {
      ...plan,
      segments: [
        { ...plan.segments[0], transition: 'match-object', transitionTargetId: 'output', transitionToTargetId: 'resolved' },
        { id: 'show-result', sceneId: 'result', purpose: 'summarize', focus: 'target', camera: 'follow-target', focusSpec: { targetId: 'resolved' }, transition: 'cut' },
      ],
    };
    assert.deepEqual(validateDirectionPlan(paired, twoSceneDocument), []);
    assert.deepEqual(
      compileDirectionPlan(paired).sceneActions.slice(0, 1).map(({ transitionTargetId, transitionToTargetId }) => ({ transitionTargetId, transitionToTargetId })),
      [{ transitionTargetId: 'output', transitionToTargetId: 'resolved' }],
    );
    const invalid = { ...paired, segments: [{ ...paired.segments[0], transitionToTargetId: 'missing' }, paired.segments[1]] };
    assert.ok(validateDirectionPlan(invalid, twoSceneDocument).some((item) => item.code === 'unknown_direction_transition_destination'));
  });

  it('diagnoses incompatible focus and camera instructions', () => {
    const issues = validateDirectionPlan({
      ...plan,
      segments: [{ ...plan.segments[0], focus: 'overview', camera: 'overview' }],
    }, document);
    assert.ok(issues.some((item) => item.code === 'conflicting_direction_focus'));
    assert.ok(issues.some((item) => item.code === 'conflicting_direction_camera'));
  });

  it('derives a beat-backed sidecar and embeds compiled direction in meta', () => {
    const explainer = {
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'directed-flow',
      scenes: [{
        ...document.scenes[0],
        explanation: {
          cues: [{ id: 'cue', text: 'Follow input to output.' }],
          beats: [{
            id: 'follow', cueId: 'cue', anchor: { text: 'input' },
            visuals: [{ targetId: 'input', action: 'focus' }, { targetId: 'output', action: 'highlight' }],
          }],
        },
      }],
    };
    const derived = deriveDirectionPlan(explainer);
    assert.deepEqual(validateDirectionPlan(derived, explainer), []);
    assert.equal(derived.segments[0].focusSpec.beatId, 'follow');
    const compiled = compileExplainerDocumentToTsx(explainer);
    assert.equal(compiled.directionPlan.id, 'directed-flow.direction');
    assert.deepEqual(compiled.compiledDirection.attention.map((item) => item.targetId), ['input', 'output']);
    assert.match(compiled.code, /direction:/);
  });

  it('keeps semantic direction stable across duration and chapter reflow', () => {
    const base = {
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'stable-direction',
      scenes: [{
        ...document.scenes[0], duration: 120,
        explanation: {
          cues: [{ id: 'cue', text: 'Follow input to output.' }],
          beats: [{ id: 'follow', cueId: 'cue', anchor: { text: 'input' }, visuals: [{ targetId: 'input', action: 'focus' }, { targetId: 'output', action: 'highlight' }] }],
        },
      }],
      chapters: [{ id: 'chapter-a', sceneIds: ['flow'] }],
    };
    const reflowed = {
      ...base,
      scenes: [{ ...base.scenes[0], duration: 240, transitionDuration: 18 }],
      chapters: [{ id: 'chapter-reflowed', sceneIds: ['flow'] }],
    };
    assert.deepEqual(deriveDirectionPlan(reflowed), deriveDirectionPlan(base));
  });
});
