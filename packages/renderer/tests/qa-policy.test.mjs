import assert from 'node:assert/strict';
import test from 'node:test';

import { applyQaSuppressions, parseQaConfig } from '../dist/qa-policy.js';

test('QA config requires a versioned profile and documented suppressions', () => {
  const config = parseQaConfig({
    version: '1.0',
    pacingProfile: 'explainer-v1',
    suppressions: [{ code: 'highlight_too_short', path: 'pacing.highlights[0]', reason: 'Intentional pulse emphasis' }],
  });
  assert.equal(config.pacingProfile, 'explainer-v1');
  assert.throws(() => parseQaConfig({ version: '1.0', suppressions: [
    { code: 'highlight_too_short', path: 'pacing.highlights[0]', reason: 'short' },
  ] }), /at least 8 characters/);
  assert.throws(() => parseQaConfig({ version: '2.0' }), /version must be "1.0"/);
});

test('QA suppressions match warning code and path but never hide errors', () => {
  const suppression = { code: 'highlight_too_short', path: 'pacing.highlights[0]', reason: 'Intentional pulse emphasis' };
  const result = applyQaSuppressions([
    { severity: 'warning', code: 'highlight_too_short', path: 'pacing.highlights[0]', message: 'short' },
    { severity: 'warning', code: 'highlight_too_short', path: 'pacing.highlights[1]', message: 'other' },
    { severity: 'error', code: 'highlight_too_short', path: 'pacing.highlights[0]', message: 'fatal' },
  ], [suppression]);
  assert.equal(result.suppressed.length, 1);
  assert.equal(result.active.filter((issue) => issue.code === 'highlight_too_short').length, 2);
  assert.equal(result.unused.length, 0);
});

test('unused suppressions remain visible as diagnostics', () => {
  const result = applyQaSuppressions([], [{
    code: 'small_font', path: 'frames[0]', reason: 'Legacy fixture allowance',
  }]);
  assert.equal(result.active[0].code, 'unused_qa_suppression');
  assert.equal(result.unused.length, 1);
});
