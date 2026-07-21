import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePlan } from '../dist/validate.js';

test('validatePlan fills deterministic defaults', () => {
  const plan = validatePlan({
    version: '1.0',
    name: 'Demo',
    startUrl: 'https://example.com',
    viewport: { width: 1280, height: 720 },
    actions: [{ id: 'wait', type: 'wait', label: 'Wait', durationMs: 100 }],
  });
  assert.equal(plan.captureFps, 15);
  assert.equal(plan.renderFps, 30);
  assert.equal(plan.maxZoom, 2.2);
});

test('validatePlan rejects executable URL protocols', () => {
  assert.throws(() => validatePlan({
    version: '1.0',
    name: 'Bad',
    startUrl: 'javascript:alert(1)',
    viewport: { width: 1280, height: 720 },
    actions: [{ id: 'wait', type: 'wait', label: 'Wait' }],
  }), /http, https, or file/);
});
