import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runBrowserCli } from '../dist/cli.js';

function bufferedIo() {
  const stdout = [];
  const stderr = [];
  return {
    io: { stdout: (line) => stdout.push(line), stderr: (line) => stderr.push(line) },
    stdout,
    stderr,
  };
}

function writePlan(dir) {
  const planPath = path.join(dir, 'plan.json');
  fs.writeFileSync(planPath, JSON.stringify({
    version: '1.0', name: 'Browser CLI', startUrl: 'https://example.test',
    viewport: { width: 1280, height: 720 },
    actions: [{ id: 'wait', type: 'wait', label: 'Wait', durationMs: 10 }],
  }));
  return planPath;
}

test('browser CLI exposes record command and structured help', async () => {
  const buffered = bufferedIo();
  assert.equal(await runBrowserCli(['--help', '--json'], buffered.io), 0);
  const help = JSON.parse(buffered.stdout[0]);
  assert.equal(help.command, 'help');
  assert.match(help.usage, /seqvio-browser record/);
  assert.match(help.usage, /--withAudio/);
  assert.match(help.usage, /--burnCaptions/);
});

test('browser record forwards independent audio, caption, and QA options', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-browser-cli-options-'));
  const planPath = writePlan(root);
  const buffered = bufferedIo();
  let receivedOptions;
  const qaConfig = path.join(root, 'qa.json');
  fs.writeFileSync(qaConfig, '{}');
  const exitCode = await runBrowserCli([
    'record', '--plan', planPath, '--outputDir', root, '--jobId', 'options',
    '--withAudio', '--burnCaptions', '--provider', 'openai', '--voice', 'alloy',
    '--qaConfig', qaConfig, '--json',
  ], buffered.io, {
    pipeline: async (_plan, jobDir, _onProgress, options) => {
      receivedOptions = options;
      const artifactManifestPath = path.join(jobDir, 'artifacts.json');
      const outputVideoPath = path.join(jobDir, 'final.mp4');
      fs.writeFileSync(artifactManifestPath, '{}');
      fs.writeFileSync(outputVideoPath, 'video');
      return { artifactManifestPath, outputVideoPath };
    },
  });
  assert.equal(exitCode, 0);
  assert.deepEqual(receivedOptions, {
    withAudio: true, burnCaptions: true, audioProvider: 'openai', audioVoice: 'alloy', qaConfig,
  });
});

test('browser captions require synthesized audio', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-browser-cli-caption-'));
  const buffered = bufferedIo();
  const exitCode = await runBrowserCli([
    'record', '--plan', writePlan(root), '--outputDir', root, '--jobId', 'caption',
    '--burnCaptions', '--json',
  ], buffered.io);
  assert.equal(exitCode, 2);
  assert.match(JSON.parse(buffered.stdout[0]).error.message, /requires --withAudio/);
});

test('browser record emits one success object and sends progress to stderr', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-browser-cli-'));
  const planPath = writePlan(root);
  const buffered = bufferedIo();
  const exitCode = await runBrowserCli([
    'record', '--plan', planPath, '--outputDir', root, '--jobId', 'job-1', '--json',
  ], buffered.io, {
    pipeline: async (_plan, jobDir, onProgress) => {
      onProgress?.({ phase: 'recording', percent: 25, message: 'Recording' });
      const artifactManifestPath = path.join(jobDir, 'artifacts.json');
      const outputVideoPath = path.join(jobDir, 'final.mp4');
      fs.writeFileSync(artifactManifestPath, '{}');
      fs.writeFileSync(outputVideoPath, 'video');
      return { artifactManifestPath, outputVideoPath };
    },
  });
  assert.equal(exitCode, 0);
  assert.equal(buffered.stdout.length, 1);
  const success = JSON.parse(buffered.stdout[0]);
  assert.equal(success.ok, true);
  assert.equal(success.adapter, 'browser');
  assert.match(buffered.stderr[0], /recording/);
});

test('browser record returns usage code before creating a job for invalid input', async () => {
  const buffered = bufferedIo();
  const exitCode = await runBrowserCli(['record', '--json'], buffered.io);
  assert.equal(exitCode, 2);
  const failure = JSON.parse(buffered.stdout[0]);
  assert.equal(failure.error.code, 'invalid_input');
  assert.equal(failure.jobDir, undefined);
});

test('browser CLI rejects invalid serve options and existing job directories', async () => {
  const invalidServe = bufferedIo();
  assert.equal(await runBrowserCli(['serve', '--port', '70000', '--json'], invalidServe.io), 2);
  assert.equal(JSON.parse(invalidServe.stdout[0]).error.code, 'invalid_input');

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-browser-cli-existing-'));
  const planPath = writePlan(root);
  const jobDir = path.join(root, 'existing');
  fs.mkdirSync(jobDir);
  fs.writeFileSync(path.join(jobDir, 'keep.txt'), 'keep');
  const existing = bufferedIo();
  assert.equal(await runBrowserCli([
    'record', '--plan', planPath, '--outputDir', root, '--jobId', 'existing', '--json',
  ], existing.io), 2);
  assert.match(JSON.parse(existing.stdout[0]).error.message, /already exists/);
  assert.equal(fs.readFileSync(path.join(jobDir, 'keep.txt'), 'utf8'), 'keep');
});
