import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runTerminalCli } from '../dist/cli.js';

function bufferedIo() {
  const stdout = [];
  const stderr = [];
  return {
    io: { stdout: (line) => stdout.push(line), stderr: (line) => stderr.push(line) },
    stdout,
    stderr,
  };
}

test('terminal CLI returns structured help and usage errors in json mode', async () => {
  const help = bufferedIo();
  assert.equal(await runTerminalCli(['--help', '--json'], help.io), 0);
  assert.equal(JSON.parse(help.stdout[0]).command, 'help');
  assert.match(JSON.parse(help.stdout[0]).usage, /--burnCaptions/);

  const invalid = bufferedIo();
  assert.equal(await runTerminalCli(['record', '--unknown', '--json'], invalid.io), 2);
  const failure = JSON.parse(invalid.stdout[0]);
  assert.equal(failure.ok, false);
  assert.equal(failure.error.code, 'invalid_arguments');
  assert.equal(invalid.stdout.length, 1);
});

test('terminal forwards independent audio, caption, and QA options', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-terminal-cli-options-'));
  const buffered = bufferedIo();
  const qaConfig = path.join(outputDir, 'qa.json');
  fs.writeFileSync(qaConfig, '{}');
  let receivedOptions;
  const exitCode = await runTerminalCli([
    'record', '--sample', '--outputDir', outputDir, '--jobId', 'options',
    '--withAudio', '--burnCaptions', '--provider', 'openai', '--voice', 'alloy',
    '--qaConfig', qaConfig, '--json',
  ], buffered.io, {
    pipeline: async (_plan, jobDir, _progress, options) => {
      receivedOptions = options;
      const artifactManifestPath = path.join(jobDir, 'artifacts.json');
      const outputVideoPath = path.join(jobDir, 'final.mp4');
      fs.writeFileSync(artifactManifestPath, '{}');
      fs.writeFileSync(outputVideoPath, 'video');
      return { engine: 'native', manifest: {}, manifestPath: '', castPath: '', outputVideoPath, artifactManifestPath };
    },
  });
  assert.equal(exitCode, 0);
  assert.deepEqual(receivedOptions, {
    withAudio: true, burnCaptions: true, audioProvider: 'openai', audioVoice: 'alloy', qaConfig,
  });
});

test('terminal captions require synthesized audio', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-terminal-cli-caption-'));
  const buffered = bufferedIo();
  const exitCode = await runTerminalCli([
    'record', '--sample', '--outputDir', outputDir, '--jobId', 'caption', '--burnCaptions', '--json',
  ], buffered.io);
  assert.equal(exitCode, 2);
  assert.match(JSON.parse(buffered.stdout[0]).error.message, /requires --withAudio/);
});

test('terminal CLI emits one success object and sends progress to stderr', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-terminal-cli-'));
  const buffered = bufferedIo();
  const exitCode = await runTerminalCli([
    'record', '--sample', '--outputDir', outputDir, '--jobId', 'job-1', '--json',
  ], buffered.io, {
    pipeline: async (_plan, jobDir, onProgress) => {
      onProgress?.({ phase: 'recording', percent: 50, message: 'Halfway' });
      const artifactManifestPath = path.join(jobDir, 'artifacts.json');
      const outputVideoPath = path.join(jobDir, 'final.mp4');
      fs.writeFileSync(artifactManifestPath, '{}');
      fs.writeFileSync(outputVideoPath, 'video');
      return {
        engine: 'native', manifest: {}, manifestPath: path.join(jobDir, 'recording-manifest.json'),
        castPath: path.join(jobDir, 'session.cast'), outputVideoPath, artifactManifestPath,
      };
    },
  });
  assert.equal(exitCode, 0);
  assert.equal(buffered.stdout.length, 1);
  const success = JSON.parse(buffered.stdout[0]);
  assert.equal(success.ok, true);
  assert.equal(success.jobId, 'job-1');
  assert.match(buffered.stderr[0], /recording/);
});

test('terminal CLI writes a failed artifact manifest on pipeline failure', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-terminal-cli-fail-'));
  const buffered = bufferedIo();
  const exitCode = await runTerminalCli([
    'record', '--sample', '--outputDir', outputDir, '--jobId', 'failed-job', '--json',
  ], buffered.io, { pipeline: async () => { throw new Error('capture failed'); } });
  assert.equal(exitCode, 3);
  const failure = JSON.parse(buffered.stdout[0]);
  assert.equal(failure.error.code, 'pipeline_failed');
  const artifact = JSON.parse(fs.readFileSync(failure.artifactManifestPath, 'utf8'));
  assert.equal(artifact.status, 'failed');
});

test('terminal CLI refuses to overwrite an existing job directory', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-terminal-cli-existing-'));
  const jobDir = path.join(outputDir, 'existing');
  fs.mkdirSync(jobDir);
  fs.writeFileSync(path.join(jobDir, 'keep.txt'), 'keep');
  const buffered = bufferedIo();
  const exitCode = await runTerminalCli([
    'record', '--sample', '--outputDir', outputDir, '--jobId', 'existing', '--json',
  ], buffered.io);
  assert.equal(exitCode, 2);
  assert.match(JSON.parse(buffered.stdout[0]).error.message, /already exists/);
  assert.equal(fs.readFileSync(path.join(jobDir, 'keep.txt'), 'utf8'), 'keep');
});
