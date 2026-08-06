import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDirectorTask, validateDirectorArtifacts } from '../dist/index.js';

const document = {
  format: 'seqvio-explainer', schemaVersion: '1.0', id: 'director-example',
  scenes: [{
    type: 'infographic', id: 'results',
    metrics: [{ id: 'before', label: 'Before', value: '17' }, { id: 'after', label: 'After', value: '6' }],
    explanation: { cues: [{ id: 'cue', text: 'Compare before and after.' }], beats: [{ id: 'compare', cueId: 'cue', anchor: { text: 'before and after' }, visuals: [{ targetId: 'before', action: 'compare', relatedTargetId: 'after' }] }] },
  }],
};

describe('Director task contract', () => {
  it('prepares a renderer-independent generation task with a derived baseline', () => {
    const task = createDirectorTask(document, 'generate');
    assert.equal(task.format, 'seqvio-director-task');
    assert.equal(task.baseline.directionPlan.id, 'director-example.direction');
    assert.deepEqual(task.requestedArtifacts, ['directionPlan', 'attentionSequence', 'motionGrammar']);
    assert.deepEqual(task.diagnostics, []);
    assert.ok(task.constraints.every((value) => !value.includes('React')));
  });

  it('turns invalid candidate artifacts into reviewable repair suggestions', () => {
    const candidate = {
      directionPlan: {
        format: 'seqvio-direction-plan', version: '1.0', id: 'bad',
        segments: [{ id: 'bad-focus', sceneId: 'results', purpose: 'summarize', focus: 'target', camera: 'overview', focusSpec: { targetIds: ['before', 'missing'] }, transition: 'cut' }],
      },
      attentionSequence: [{ id: 'held', sceneId: 'results', targetId: 'before', kind: 'box', start: 10, duration: 20, persistence: 'until-clear' }],
      motionGrammar: { format: 'seqvio-motion-grammar', version: '1.0', id: 'bad-motion', steps: [{ id: 'trace', sceneId: 'results', action: 'trace', targetId: 'before', pathTargetIds: ['before'] }] },
    };
    const diagnostics = validateDirectorArtifacts(candidate, document);
    assert.ok(diagnostics.some((item) => item.artifact === 'directionPlan' && item.code === 'unknown_direction_target'));
    assert.ok(diagnostics.some((item) => item.artifact === 'attentionSequence' && item.code === 'missing_clear_frame'));
    assert.ok(diagnostics.some((item) => item.artifact === 'motionGrammar' && item.code === 'missing_trace_path'));
    const task = createDirectorTask(document, 'repair', candidate);
    assert.equal(task.diagnostics.length, diagnostics.length);
    assert.ok(task.diagnostics.every((item) => item.suggestion.length > 0));
  });
});
