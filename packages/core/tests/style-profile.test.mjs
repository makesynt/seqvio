import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { semanticStyleInvariant, validateStyleProfile } from '../dist/index.js';

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
});
