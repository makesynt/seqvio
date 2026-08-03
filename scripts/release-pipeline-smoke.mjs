#!/usr/bin/env node

/**
 * Deterministic release-pipeline smoke test for terminal and browser capture.
 * Uses local FFmpeg fixtures, so it never needs a TTS provider or network.
 */

import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { compileBrowserCapture } from '@seqvio/browser-recorder';
import { compileCaptureManifestToExplainerDocument } from '@seqvio/capture';
import { compileExplainerDocumentToTsx, resolveScenePacing } from '@seqvio/core';
import { compileTerminalCapture } from '@seqvio/terminal-narrator';
import puppeteer from 'puppeteer';
import {
  reflowSynthesizedTimeline,
  validateAudioManifest,
} from '../packages/renderer/dist/audio/manifest.js';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quick = process.env.SEQVIO_RELEASE_SMOKE_PROFILE === 'quick';
const fps = numericArgument('fps', quick ? 10 : 30);

function numericArgument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`--${name} requires a positive number.`);
  return Math.round(value);
}

const width = numericArgument('width', quick ? 640 : 1280);
const height = numericArgument('height', quick ? 360 : 720);

function requestedKinds() {
  const kindIndex = process.argv.indexOf('--kind');
  const kind = kindIndex >= 0 ? process.argv[kindIndex + 1] : 'all';
  if (!['all', 'terminal', 'browser'].includes(kind)) {
    throw new Error('--kind must be all, terminal, or browser.');
  }
  return kind === 'all' ? ['terminal', 'browser'] : [kind];
}

function artifactOutputDir() {
  const outDirIndex = process.argv.indexOf('--outDir');
  if (outDirIndex >= 0) {
    const value = process.argv[outDirIndex + 1];
    if (!value || value.startsWith('--')) throw new Error('--outDir requires a path.');
    return path.resolve(root, value);
  }
  return process.argv.includes('--keepArtifacts')
    ? path.join(root, 'output', 'release-pipeline-smoke')
    : undefined;
}

async function runNode(script, args) {
  await execFileAsync(process.execPath, [script, ...args], {
    cwd: root,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
}

async function runFfmpeg(args) {
  return execFileAsync(ffmpegInstaller.path, args, {
    cwd: root,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
}

async function assertDecodedFrameCount(videoPath, expectedFrames) {
  const result = await runFfmpeg(['-i', videoPath, '-map', '0:v:0', '-f', 'null', '-']);
  const counts = [...result.stderr.matchAll(/frame=\s*(\d+)/g)]
    .map((match) => Number(match[1]));
  const decodedFrames = counts.at(-1);
  if (!Number.isFinite(decodedFrames) || decodedFrames < expectedFrames) {
    throw new Error(
      `Decoded video has ${decodedFrames ?? 'unknown'} frames; expected at least ${expectedFrames}.`,
    );
  }
}

async function createBrowserFixtureVideo(workDir) {
  const pagePath = path.join(workDir, 'browser-source.html');
  const screenshotPath = path.join(workDir, 'browser-source.png');
  const videoPath = path.join(workDir, 'browser-source.mp4');
  const large = width >= 1000;
  const headerHeight = large ? 64 : 54;
  const sidebarWidth = large ? 220 : 146;
  const mainPadding = large ? 32 : 18;
  await writeFile(pagePath, `<!doctype html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#f4f6f8;color:#17202a;font-family:Arial,sans-serif;letter-spacing:0;display:flex;flex-direction:column}
header{height:${headerHeight}px;flex:0 0 ${headerHeight}px;background:#17202a;color:#fff;display:flex;align-items:center;padding:0 ${large ? 34 : 22}px;gap:${large ? 22 : 14}px}header b{font-size:${large ? 24 : 18}px}.live{margin-left:auto;color:#7ee2a8;font-size:${large ? 16 : 13}px}
.shell{display:grid;grid-template-columns:${sidebarWidth}px 1fr;flex:1;min-height:0}aside{background:#fff;border-right:1px solid #dfe4e8;padding:${large ? 28 : 18}px ${large ? 18 : 12}px}.nav{padding:${large ? 14 : 9}px ${large ? 16 : 11}px;margin-bottom:${large ? 8 : 5}px;font-size:${large ? 17 : 13}px;color:#52606d}.nav.active{background:#e8f1ff;color:#1557b0;border-left:3px solid #2f80ed}
main{padding:${mainPadding}px ${large ? 40 : 22}px}.eyebrow{font-size:${large ? 15 : 12}px;color:#68737d;margin-bottom:${large ? 8 : 5}px}h1{font-size:${large ? 34 : 22}px;margin:0 0 ${large ? 24 : 14}px}.status{border:1px solid #cfd8df;background:#fff;padding:${large ? 24 : 14}px ${large ? 26 : 16}px;display:flex;align-items:center;gap:${large ? 18 : 12}px}.check{width:${large ? 38 : 26}px;height:${large ? 38 : 26}px;border-radius:50%;background:#168a4b;color:white;display:grid;place-items:center;font-weight:bold;font-size:${large ? 22 : 15}px}.status b{font-size:${large ? 21 : 15}px}.status span{display:block;color:#66727d;font-size:${large ? 16 : 12}px;margin-top:5px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:${large ? 20 : 12}px;margin-top:${large ? 20 : 12}px}.panel{background:#fff;border:1px solid #dfe4e8;padding:${large ? 22 : 12}px ${large ? 24 : 14}px}.panel h2{font-size:${large ? 15 : 12}px;margin:0 0 ${large ? 18 : 10}px;color:#66727d}.metric{font-size:${large ? 38 : 23}px;font-weight:bold}.metric small{font-size:${large ? 16 : 12}px;color:#168a4b}.row{display:flex;justify-content:space-between;border-top:1px solid #edf0f2;padding:${large ? 12 : 7}px 0;font-size:${large ? 16 : 12}px}.passed{color:#168a4b;font-weight:bold}
</style></head><body><header><b>Release Console</b><span>Pipeline #1842</span><span class="live">All systems operational</span></header><div class="shell"><aside><div class="nav active">Overview</div><div class="nav">Builds</div><div class="nav">Quality gates</div><div class="nav">Artifacts</div></aside><main><div class="eyebrow">DEPLOYMENT / MAIN</div><h1>Release validation</h1><div class="status"><div class="check">&#10003;</div><div><b>All checks passed</b><span>Terminal and browser capture pipelines are ready.</span></div></div><div class="grid"><div class="panel"><h2>TEST COVERAGE</h2><div class="metric">216 <small>passed</small></div></div><div class="panel"><h2>PIPELINE STEPS</h2><div class="row"><span>Capture QA</span><span class="passed">Passed</span></div><div class="row"><span>Frame decode</span><span class="passed">Passed</span></div></div></div></main></div></body></html>`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(pagePath).href, { waitUntil: 'load' });
    await page.screenshot({ path: screenshotPath, type: 'png' });
  } finally {
    await browser.close();
  }
  await runFfmpeg([
    '-y', '-loop', '1', '-framerate', String(fps), '-i', screenshotPath,
    '-t', '2', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', videoPath,
  ]);
  return videoPath;
}

async function createCapture(kind, workDir) {
  if (kind === 'terminal') {
    const terminalCols = width >= 1000 ? 80 : 40;
    const terminalRows = height >= 700 ? 20 : 10;
    return {
      compiler: compileTerminalCapture,
      manifest: {
        kind: 'terminal',
        name: 'terminal-release-smoke',
        durationMs: quick ? 700 : 1200,
        viewport: { width, height },
        renderFps: fps,
        cols: terminalCols,
        rows: terminalRows,
        renderOptions: { title: 'Release checks' },
        events: [
          { timeMs: 0, kind: 'stdout', text: '$ ', transient: false },
          { timeMs: quick ? 100 : 180, kind: 'stdin', text: 'printf release-ok', transient: true },
          {
            timeMs: quick ? 450 : 700,
            kind: 'stdout',
            text: 'printf release-ok\r\nrelease-ok\r\n$ ',
            transient: false,
          },
        ],
        steps: [
          {
            id: 'command',
            label: 'Run the release check',
            timeMs: quick ? 100 : 180,
            capturedState: { kind: 'terminal', stdout: 'release-ok' },
          },
          {
            id: 'result',
            label: 'Confirm the command output',
            timeMs: quick ? 450 : 700,
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

  const sourceVideoPath = await createBrowserFixtureVideo(workDir);
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
        { timeMs: 0, x: width * 0.12, y: height * 0.22 },
        { timeMs: 800, x: width * 0.72, y: height * 0.64 },
      ],
      focusTargets: [
        {
          timeMs: 300,
          x: width * 0.26,
          y: height * 0.18,
          width: width * 0.52,
          height: height * 0.34,
          zoom: 1.6,
        },
        { timeMs: 1000, x: 0, y: 0, width: 0, height: 0, reset: true },
      ],
      clicks: [{ timeMs: 650, x: width * 0.64, y: height * 0.54 }],
      maxZoom: 1.8,
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
  const durationsMs = quick ? [450, 500] : [1500, 1550];
  const gapMs = quick ? 50 : 180;
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
        offsetFrame: 0,
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
    { cueGapMs: gapMs, sceneTailMs: quick ? 150 : 600 },
  );
  return {
    ...sourceManifest,
    ...reflowed,
    tracks,
    duration: reflowed.durationFrames,
  };
}

async function runPipeline(kind, smokeTempRoot, artifactDir) {
  const workDir = await mkdtemp(path.join(smokeTempRoot, `${kind}-release-pipeline-`));
  try {
    const capturePath = path.join(workDir, 'capture.json');
    const resolvedAudioPath = path.join(workDir, 'audio-manifest.resolved.json');
    const componentPath = path.join(workDir, 'composition.tsx');
    const qaDir = path.join(workDir, 'qa');
    const outputPath = path.join(workDir, 'final.mp4');
    const capture = await createCapture(kind, workDir);
    await writeFile(capturePath, `${JSON.stringify(capture.manifest, null, 2)}\n`);

    const seed = await compileCaptureManifestToExplainerDocument(capture.manifest, {
      jobDir: workDir,
      narration: { async narrate(step) { return capture.narrate(step); } },
      compilers: { [kind]: capture.compiler },
    });
    if (!seed.audioManifestPath) throw new Error(`${kind} compiler did not emit audio manifest.`);
    await writeFile(componentPath, compileExplainerDocumentToTsx(seed.document).code);

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
      '--frames', [
        0,
        Math.round(fps * 0.5),
        Math.round(fps * 1.5),
        Math.max(0, resolvedManifest.duration - 1),
      ].filter((frame, index, frames) => frame < resolvedManifest.duration && frames.indexOf(frame) === index).join(','),
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
    await assertDecodedFrameCount(outputPath, resolvedManifest.duration);
    const qaReportPath = path.join(qaDir, 'qa-report.json');
    const report = JSON.parse(await readFile(qaReportPath, 'utf8'));
    if (report.ok !== true) throw new Error(`${kind} release smoke QA report is not ok.`);
    console.log(
      `${kind} release pipeline smoke passed (${width}x${height}, ${outputStat.size} bytes, ${resolvedManifest.duration} frames)`,
    );
    if (artifactDir) {
      await mkdir(artifactDir, { recursive: true });
      await Promise.all([
        copyFile(outputPath, path.join(artifactDir, `${kind}.mp4`)),
        copyFile(qaReportPath, path.join(artifactDir, `${kind}.qa-report.json`)),
        copyFile(resolvedAudioPath, path.join(artifactDir, `${kind}.audio-manifest.json`)),
        copyFile(capturePath, path.join(artifactDir, `${kind}.capture.json`)),
      ]);
      console.log(`${kind} preview artifacts saved to ${artifactDir}`);
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function main() {
  const smokeTempRoot = path.join(root, 'temp');
  await mkdir(smokeTempRoot, { recursive: true });
  const artifactDir = artifactOutputDir();
  for (const kind of requestedKinds()) await runPipeline(kind, smokeTempRoot, artifactDir);
}

main().catch((error) => {
  console.error(`release pipeline smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
