import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compileMotionGrammar, validateMotionGrammar } from '../dist/index.js';

const document = {
  format: 'seqvio-explainer', schemaVersion: '1.0', id: 'compare',
  scenes: [{ type: 'infographic', id: 'results', metrics: [{ id: 'before', label: 'Before', value: '17' }, { id: 'middle', label: 'Middle', value: '11' }, { id: 'after', label: 'After', value: '6' }] }],
};
const grammar = {
  format: 'seqvio-motion-grammar', version: '1.0', id: 'compare-flow',
  steps: [
    { id: 'question', sceneId: 'results', action: 'question' },
    { id: 'reveal-before', sceneId: 'results', action: 'reveal', targetId: 'before' },
    { id: 'compare', sceneId: 'results', action: 'compare', targetId: 'before', relatedTargetId: 'after' },
    { id: 'answer', sceneId: 'results', action: 'answer', targetId: 'after' },
  ],
};

describe('Motion Grammar', () => {
  it('validates and compiles semantic actions into existing contracts', () => {
    assert.deepEqual(validateMotionGrammar(grammar, document), []);
    const compiled = compileMotionGrammar(grammar);
    assert.equal(compiled.visuals.length, 3);
    assert.equal(compiled.attention.find((item) => item.id === 'compare').kind, 'connector');
    assert.equal(compiled.visuals.find((item) => item.stepId === 'compare').visual.action, 'compare');
    assert.equal(compiled.direction[0].purpose, 'hook');
  });

  it('rejects unexplained targets and incomplete comparisons', () => {
    const issues = validateMotionGrammar({ ...grammar, steps: [{ id: 'bad', sceneId: 'results', action: 'compare', targetId: 'missing' }] }, document);
    assert.ok(issues.some((item) => item.code === 'unknown_motion_target'));
    assert.ok(issues.some((item) => item.code === 'missing_compare_relation'));
  });

  it('preserves a complete guided path and deterministic seek timing', () => {
    const traceGrammar = {
      ...grammar,
      steps: [{ id: 'trace', sceneId: 'results', action: 'trace', targetId: 'before', pathTargetIds: ['before', 'middle', 'after'], startFrame: 42, holdFrames: 48 }],
    };
    assert.deepEqual(validateMotionGrammar(traceGrammar, document), []);
    const first = compileMotionGrammar(traceGrammar);
    const second = compileMotionGrammar(traceGrammar);
    assert.deepEqual(second, first);
    assert.deepEqual(first.attention[0].pathTargetIds, ['before', 'middle', 'after']);
    assert.equal(first.attention[0].start, 42);
    assert.equal(first.attention[0].duration, 48);
    assert.equal(first.visuals[0].visual.action, 'trace');
  });

  it('rejects incomplete traces and unsafe timing', () => {
    const issues = validateMotionGrammar({ ...grammar, steps: [{ id: 'bad-trace', sceneId: 'results', action: 'trace', targetId: 'before', pathTargetIds: ['before'], startFrame: -1, holdFrames: 0 }] }, document);
    assert.ok(issues.some((item) => item.code === 'missing_trace_path'));
    assert.ok(issues.some((item) => item.code === 'invalid_motion_start'));
    assert.ok(issues.some((item) => item.code === 'invalid_motion_hold'));
  });
});
