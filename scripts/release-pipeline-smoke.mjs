#!/usr/bin/env node

/**
 * Deterministic release-pipeline smoke test for terminal and browser capture.
 * Uses local FFmpeg fixtures, so it never needs a TTS provider or network.
 */

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { compileBrowserCapture } from '@seqvio/browser-recorder';
import { compileCaptureManifestToCompositionDocument } from '@seqvio/capture';
import { compileCompositionDocumentToTsx, resolveScenePacing } from '@seqvio/core';
import { compileTerminalCapture } from '@seqvio/terminal-narrator';
import {
  reflowSynthesizedTimeline,
  validateAudioManifest,
} from '../packages/renderer/dist/audio/manifest.js';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fps = 30;
const width = 640;
const height = 360;

function requestedKinds() {
  const kindIndex = process.argv.indexOf('--kind');
  const kind = kindIndex >= 0 ? process.argv[kindIndex + 1] : 'all';
  if (!['all', 'terminal', 'browser'].includes(kind)) {
    throw new Error('--kind must be all, terminal, or browser.');
  }
  return kind === 'all' ? ['terminal', 'browser'] : [kind];
}

async function runNode(script, args) {
  await execFileAsync(process.execPath, [script, ...args], {
    cwd: root,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
}

async function runFfmpeg(args) {
  await execFileAsync(ffmpegInstaller.path, args, {
    cwd: root,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
}

async function createCapture(kind, workDir) {
  if (kind === 'terminal') {
    return {
      compiler: compileTerminalCapture,
      manifest: {
        kind: 'terminal',
        name: 'terminal-release-smoke',
        durationMs: 1200,
        viewport: { width, height },
        renderFps: fps,
        cols: 40,
        rows: 10,
        events: [
          { timeMs: 0, kind: 'stdout', text: '$ ', transient: false },
          { timeMs: 180, kind: 'stdin', text: 'printf release-ok', transient: true },
          { timeMs: 700, kind: 'stdout', text: 'release-ok\n$ ', transient: false },
        ],
        steps: [
          {
            id: 'command',
            label: 'Run the release check',
            timeMs: 180,
            capturedState: { kind: 'terminal', stdout: 'release-ok' },
          },
          {
            id: 'result',
            label: 'Confirm the command output',
            timeMs: 700,
            capturedState: { kind: 'terminal', stdout: 'release-ok' },
          },
        ],
      },
      narrate(step) {
        return step.id === 'command'
          ? 'The terminal runs the release check.'
          : 'The terminal confirms the release output.';
      },
    };
  }

  const sourceVideoPath = path.join(workDir, 'browser-source.mp4');
  await runFfmpeg([
    '-y', '-f', 'lavfi', '-i', `testsrc2=size=${width}x${height}:rate=${fps}:duration=2`,
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', sourceVideoPath,
  ]);
  return {
    compiler: compileBrowserCapture,
    manifest: {
      kind: 'browser',
      name: 'browser-release-smoke',
      durationMs: 1200,
      viewport: { width, height },
      renderFps: fps,
      sourceVideo: pathToFileURL(sourceVideoPath).href,
      cursorPoints: [
        { timeMs: 0, x: 60, y: 80 },
        { timeMs: 800, x: 500, y: 260 },
      ],
      focusTargets: [
        { timeMs: 300, x: 180, y: 90, width: 220, height: 120 },
        { timeMs: 1000, x: 0, y: 0, width: 0, height: 0, reset: true },
      ],
      clicks: [{ timeMs: 650, x: 420, y: 210 }],
      steps: [
        {
          id: 'focus',
          label: 'Focus the browser result',
          timeMs: 300,
          capturedState: {
            kind: 'browser',
            url: 'https://example.test/results',
            pageTitle: 'Release results',
          },
        },
        {
          id: 'inspect',
          label: 'Inspect the recorded state',
          timeMs: 800,
          capturedState: {
            kind: 'browser',
            url: 'https://example.test/results',
            pageTitle: 'Release results',
          },
        },
      ],
    },
    narrate(step) {
      return step.id === 'focus'
        ? 'The browser focuses the recorded result.'
        : 'The browser preserves the captured state.';
    },
  };
}

async function createResolvedAudio(sourceManifest, workDir) {
  const durationsMs = [1500, 1550];
  const gapMs = 180;
  const tracks = [];
  const synthesizedNarration = [];
  let cursorMs = 0;

  for (const [index, cue] of sourceManifest.narration.entries()) {
    const durationMs = durationsMs[index] ?? 1500;
    const audioPath = path.join(workDir, `${cue.id}.wav`);
    await runFfmpeg([
      '-y', '-f', 'lavfi', '-i', `sine=frequency=${440 + index * 114}:duration=${durationMs / 1000}`,
      '-filter:a', 'volume=0.2', '-c:a', 'pcm_s16le', audioPath,
    ]);
    synthesizedNarration.push({
      ...cue,
      startMs: cursorMs,
      endMs: cursorMs + durationMs,
      chunks: [{
        text: cue.text,
        offsetFrame: Math.round((cursorMs / 1000) * fps),
        durationFrame: Math.round((durationMs / 1000) * fps),
      }],
    });
    tracks.push({
      id: cue.id,
      kind: 'narration',
      src: path.basename(audioPath),
      offsetMs: cursorMs,
    });
    cursorMs += durationMs + gapMs;
  }

  const reflowed = reflowSynthesizedTimeline(
    sourceManifest,
    synthesizedNarration,
    fps,
    { cueGapMs: gapMs, sceneTailMs: 600 },
  );
  return {
    ...sourceManifest,
    ...reflowed,
    tracks,
    duration: reflowed.durationFrames,
  };
}

async function runPipeline(kind, smokeTempRoot) {
  const workDir = await mkdtemp(path.join(smokeTempRoot, `${kind}-release-pipeline-`));
  try {
    const capturePath = path.join(workDir, 'capture.json');
    const resolvedAudioPath = path.join(workDir, 'audio-manifest.resolved.json');
    const componentPath = path.join(workDir, 'composition.tsx');
    const qaDir = path.join(workDir, 'qa');
    const outputPath = path.join(workDir, 'final.mp4');
    const capture = await createCapture(kind, workDir);
    await writeFile(capturePath, `${JSON.stringify(capture.manifest, null, 2)}\n`);

    const seed = await compileCaptureManifestToCompositionDocument(capture.manifest, {
      jobDir: workDir,
      narration: { async narrate(step) { return capture.narrate(step); } },
      compilers: { [kind]: capture.compiler },
    });
    if (!seed.audioManifestPath) throw new Error(`${kind} compiler did not emit audio manifest.`);
    await writeFile(componentPath, compileCompositionDocumentToTsx(seed.document).code);

    const sourceAudio = JSON.parse(await readFile(seed.audioManifestPath, 'utf8'));
    const scene = seed.document.scenes[0];
    const paced = resolveScenePacing(scene, fps);
    const sourceManifest = {
      ...sourceAudio,
      pacingProfile: 'explainer-v1',
      sceneTimings: [{
        sceneId: scene.id,
        startFrame: 0,
        durationFrames: paced.durationFrames,
        sourceDurationFrames: paced.durationFrames,
        highlights: paced.highlights,
      }],
    };
    const resolvedManifest = await createResolvedAudio(sourceManifest, workDir);
    const manifestErrors = validateAudioManifest(resolvedManifest, { baseDir: workDir })
      .filter((issue) => issue.severity === 'error');
    if (manifestErrors.length > 0) {
      throw new Error(`Resolved ${kind} audio manifest is invalid: ${JSON.stringify(manifestErrors)}`);
    }
    await writeFile(resolvedAudioPath, `${JSON.stringify(resolvedManifest, null, 2)}\n`);

    await runNode(path.join(root, 'packages/renderer/dist/qa-cli.js'), [
      '--component', componentPath,
      '--outDir', qaDir,
      '--profile', 'capture',
      '--captureManifest', capturePath,
      '--audioManifest', resolvedAudioPath,
      '--width', String(width),
      '--height', String(height),
      '--fps', String(fps),
      '--frames', `0,30,90,${Math.max(0, resolvedManifest.duration - 1)}`,
      '--pixelRatio', '1',
      '--ci',
    ]);
    await runNode(path.join(root, 'packages/renderer/dist/cli.js'), [
      '--component', componentPath,
      '--audioManifest', resolvedAudioPath,
      '--output', outputPath,
      '--width', String(width),
      '--height', String(height),
      '--fps', String(fps),
      '--quality', 'low',
      '--pixelRatio', '1',
      '--workers', '1',
    ]);

    const outputStat = await stat(outputPath);
    if (outputStat.size < 1024) throw new Error(`${kind} MP4 is unexpectedly small.`);
    await runFfmpeg(['-v', 'error', '-i', outputPath, '-f', 'null', '-']);
    const report = JSON.parse(await readFile(path.join(qaDir, 'qa-report.json'), 'utf8'));
    if (report.ok !== true) throw new Error(`${kind} release smoke QA report is not ok.`);
    console.log(`${kind} release pipeline smoke passed (${outputStat.size} bytes, ${resolvedManifest.duration} frames)`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function main() {
  const smokeTempRoot = path.join(root, 'temp');
  await mkdir(smokeTempRoot, { recursive: true });
  for (const kind of requestedKinds()) await runPipeline(kind, smokeTempRoot);
}

main().catch((error) => {
  console.error(`release pipeline smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
