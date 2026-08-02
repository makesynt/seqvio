import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  CAPTURE_ADAPTER_LIFECYCLE,
  CAPTURE_CLI_CONTRACT_VERSION,
  collectCaptureArtifacts,
  validateCaptureJobId,
  writeCaptureArtifactManifest,
} from '../dist/cli-contract.js';

test('artifact manifest uses portable paths and explicit lifecycle metadata', () => {
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-artifact-contract-'));
  const planPath = path.join(jobDir, 'plan.json');
  const videoPath = path.join(jobDir, 'final.mp4');
  fs.writeFileSync(planPath, '{}');
  fs.writeFileSync(videoPath, 'video');

  const outputPath = writeCaptureArtifactManifest(jobDir, {
    adapter: 'browser', jobId: 'job-1', status: 'complete',
    artifacts: collectCaptureArtifacts(jobDir, 'browser'),
    createdAt: '2026-08-01T00:00:00.000Z',
  });
  const manifest = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.equal(manifest.cliContractVersion, CAPTURE_CLI_CONTRACT_VERSION);
  assert.equal(manifest.lifecycle, CAPTURE_ADAPTER_LIFECYCLE);
  assert.equal(manifest.jobId, 'job-1');
  assert.equal(manifest.artifacts.plan, 'plan.json');
  assert.equal(manifest.artifacts.outputVideo, 'final.mp4');
  assert.equal(path.isAbsolute(manifest.artifacts.outputVideo), false);
});

test('artifact manifest rejects paths outside the job directory', () => {
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-artifact-boundary-'));
  assert.throws(() => writeCaptureArtifactManifest(jobDir, {
    adapter: 'terminal', status: 'complete',
    artifacts: { plan: path.join(path.dirname(jobDir), 'outside.json') },
  }), /inside the job directory/);
});

test('artifact collection includes capture QA report', () => {
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-capture-qa-'));
  fs.writeFileSync(path.join(jobDir, 'qa-report.json'), '{"ok":true}');
  const artifacts = collectCaptureArtifacts(jobDir, 'browser');
  assert.equal(artifacts.qaReport, path.join(jobDir, 'qa-report.json'));
});

test('job id validation blocks path traversal and accepts stable ids', () => {
  assert.equal(validateCaptureJobId('release-check_01'), 'release-check_01');
  assert.throws(() => validateCaptureJobId('../escape'), /jobId must be/);
});
