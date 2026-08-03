import { test } from 'node:test';
import assert from 'node:assert';
import { compileCaptureManifestToExplainerDocument } from '../dist/compile.js';
import { validateCaptureManifest } from '../dist/validate.js';
import { scanCaptureManifestForSecrets } from '../dist/security.js';

const terminalManifest = {
  kind: 'terminal',
  name: 't',
  durationMs: 1000,
  viewport: { width: 1280, height: 720 },
  renderFps: 30,
  steps: [],
  events: [],
  cols: 80,
  rows: 24,
};

test('dispatcher calls the compiler registered for the manifest kind', async () => {
  const compiler = async (m) => ({
    document: { format: 'seqvio-explainer', schemaVersion: '1.0', id: m.name, width: 1280, height: 720, fps: 30, scenes: [] },
  });
  const seed = await compileCaptureManifestToExplainerDocument(terminalManifest, {
    compilers: { terminal: compiler },
  });
  assert.equal(seed.document.id, 't');
});

test('dispatcher throws when no compiler is registered for the kind', async () => {
  await assert.rejects(
    () => compileCaptureManifestToExplainerDocument(terminalManifest, { compilers: {} }),
    /No compiler registered for capture kind "terminal"/
  );
});

test('dispatcher passes options through to the compiler', async () => {
  let receivedOpts;
  const compiler = async (m, opts) => {
    receivedOpts = opts;
    return { document: { format: 'seqvio-explainer', schemaVersion: '1.0', id: 'x', scenes: [] } };
  };
  const narration = { narrate: async () => 'n' };
  await compileCaptureManifestToExplainerDocument(terminalManifest, {
    compilers: { terminal: compiler },
    narration,
    jobDir: '/tmp/job',
  });
  assert.equal(receivedOpts.narration, narration);
  assert.equal(receivedOpts.jobDir, '/tmp/job');
});

test('capture validation accepts a complete terminal manifest', () => {
  const manifest = {
    ...terminalManifest,
    steps: [
      {
        id: 'run',
        label: 'Run tests',
        timeMs: 0,
        capturedState: { kind: 'terminal', stdout: 'ok' },
      },
    ],
    events: [{ timeMs: 0, kind: 'stdout', text: 'ok' }],
  };
  assert.deepEqual(
    validateCaptureManifest(manifest, { requireCapturedState: true }),
    [],
  );
});

test('capture validation reports timeline, state, and media failures with stable codes', () => {
  const manifest = {
    kind: 'browser',
    name: 'broken',
    durationMs: 1000,
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    steps: [
      { id: 'later', label: 'Later', timeMs: 900 },
      { id: 'earlier', label: 'Earlier', timeMs: 100 },
    ],
    sourceVideo: 'missing.mp4',
    cursorPoints: [{ timeMs: 1200, x: 1, y: 2 }],
    focusTargets: [],
    clicks: [],
  };
  const codes = validateCaptureManifest(manifest, {
    requireCapturedState: true,
    checkMediaFiles: true,
    baseDir: process.cwd(),
  }).map((issue) => issue.code);
  assert.ok(codes.includes('non_monotonic_capture_steps'));
  assert.ok(codes.includes('missing_captured_state'));
  assert.ok(codes.includes('missing_browser_media'));
  assert.ok(codes.includes('browser_point_after_duration'));
});

test('capture security scan reports credential locations without returning secret values', () => {
  const secret = 'ghp_1234567890abcdefghijklmnop';
  const manifest = {
    ...terminalManifest,
    steps: [{ id: 'run', label: 'Run', timeMs: 0 }],
    events: [{ timeMs: 0, kind: 'stdout', text: `token=${secret}` }],
  };
  const findings = scanCaptureManifestForSecrets(manifest);
  assert.ok(findings.some((finding) => finding.path === 'events[0].text'));
  assert.ok(findings.some((finding) => finding.code === 'credential_like_value'));
  assert.doesNotMatch(JSON.stringify(findings), new RegExp(secret));
});

test('capture security scan detects sensitive browser URLs without inspecting screenshots', () => {
  const manifest = {
    kind: 'browser',
    name: 'browser',
    durationMs: 1000,
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    steps: [
      {
        id: 'open',
        label: 'Open page',
        timeMs: 0,
        capturedState: {
          kind: 'browser',
          url: 'https://example.test/private?access_token=hidden',
          screenshot: 'data:image/png;base64,not-scanned',
        },
      },
    ],
    sourceVideo: 'capture.mp4',
    cursorPoints: [],
    focusTargets: [],
    clicks: [],
  };
  const findings = scanCaptureManifestForSecrets(manifest);
  assert.ok(
    findings.some(
      (finding) =>
        finding.code === 'sensitive_url_parameter' &&
        finding.path === 'steps[0].capturedState.url',
    ),
  );
  assert.doesNotMatch(JSON.stringify(findings), /not-scanned/);
});
