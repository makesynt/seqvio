import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyStyleProfile, compileExplainerDocumentToTsx, semanticStyleInvariant, validateStyleProfile } from '../dist/index.js';

const profile = {
  format: 'seqvio-style-profile', version: '1.0', id: 'clean-technical', label: 'Clean Technical',
  typography: { headingFamily: 'Inter', bodyFamily: 'Inter', monoFamily: 'JetBrains Mono', scale: 'editorial' },
  motionDensity: 'restrained', cameraPolicy: 'semantic-focus', transitionPolicy: 'focus-transfer',
  attentionPersistence: 'until-handoff', spacing: 'comfortable',
  paletteRoles: { background: '#0f172a', ink: '#f8fafc', accent: '#38bdf8', muted: '#94a3b8' },
};

describe('Style Profile', () => {
  it('validates a semantic style profile', () => assert.deepEqual(validateStyleProfile(profile), []));
  it('rejects semantic changes caused by style application', () => {
    const before = { id: 'x', scenes: [{ id: 's', explanation: { beats: [{ id: 'b' }] } }] };
    assert.equal(semanticStyleInvariant(before, { ...before, scenes: [{ ...before.scenes[0], explanation: { beats: [] } }] }).ok, false);
    assert.equal(semanticStyleInvariant(before, before).ok, true);
  });
  it('applies visual profiles without changing semantic timing or identity', () => {
    const document = {
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'styled', fps: 30,
      scenes: [{ type: 'infographic', id: 'scene', duration: 60, metrics: [{ id: 'result', label: 'Result', value: 'Ready' }], explanation: { cues: [{ id: 'cue', text: 'The result is ready.' }], beats: [{ id: 'beat', cueId: 'cue', anchor: { text: 'result' }, visuals: [{ targetId: 'result', action: 'focus' }] }] } }],
    };
    const styled = applyStyleProfile(document, profile);
    assert.equal(semanticStyleInvariant(document, styled).ok, true);
    const compiled = compileExplainerDocumentToTsx(styled);
    assert.match(compiled.code, /StyleProfileProvider/);
    assert.match(compiled.code, /clean-technical/);
    assert.deepEqual(compiled.compiledDirection.attention.map((item) => item.targetId), ['result']);
  });
});
