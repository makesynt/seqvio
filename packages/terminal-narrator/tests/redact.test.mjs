import assert from 'node:assert/strict';
import test from 'node:test';

import { redactPlanForArtifacts, redactSecrets } from '../dist/redact.js';

test('redactSecrets ignores short values', () => {
  process.env.TEST_SHORT_KEY = 'ab';
  try {
    const result = redactSecrets('hello ab world', { minLength: 4 });
    assert.equal(result, 'hello ab world');
  } finally {
    delete process.env.TEST_SHORT_KEY;
  }
});

test('redactSecrets redacts token-like env values', () => {
  process.env.TEST_TOKEN = 's3cret-val!';
  try {
    const result = redactSecrets('hello s3cret-val! world');
    assert.ok(result.includes('[REDACTED]'));
    assert.equal(result.includes('s3cret-val!'), false);
  } finally {
    delete process.env.TEST_TOKEN;
  }
});

test('redactSecrets sorts longest secrets first', () => {
  process.env.TEST_KEY = 'secret';
  process.env.TEST_TOKEN = 'supersecret';
  try {
    const result = redactSecrets('use supersecret and secret');
    assert.equal(result.includes('supersecret'), false);
    assert.equal(result.includes('secret'), false);
    const count = (result.match(/\[REDACTED\]/g) || []).length;
    assert.equal(count, 2);
  } finally {
    delete process.env.TEST_KEY;
    delete process.env.TEST_TOKEN;
  }
});

test('redactSecrets applies custom regex patterns', () => {
  const result = redactSecrets('id=abc123 key=xyz789', {
    patterns: [/abc\d+/, /xyz\d+/].map((s) => new RegExp(s, 'g')),
  });
  assert.equal(result.includes('abc123'), false);
  assert.equal(result.includes('xyz789'), false);
});

test('redactSecrets does not redact non-secret-key env values', () => {
  process.env.NORMAL_VAR = 'hello-world';
  try {
    const result = redactSecrets('path: hello-world');
    assert.equal(result.includes('hello-world'), true);
  } finally {
    delete process.env.NORMAL_VAR;
  }
});

test('redactPlanForArtifacts removes secrets from env and input text', () => {
  const plan = {
    version: '1.0',
    name: 'secret demo',
    viewport: { width: 1280, height: 720 },
    shell: {
      command: 'bash',
      env: { API_KEY: 'top-secret-value', NORMAL_VAR: 'visible' },
    },
    inputs: [
      { id: 'login', label: 'Login', text: 'tool --token top-secret-value' },
    ],
  };

  const safe = redactPlanForArtifacts(plan);
  assert.equal(safe.shell.env.API_KEY, '[REDACTED]');
  assert.equal(safe.shell.env.NORMAL_VAR, 'visible');
  assert.equal(safe.inputs[0].text.includes('top-secret-value'), false);
  assert.equal(plan.shell.env.API_KEY, 'top-secret-value');
});
