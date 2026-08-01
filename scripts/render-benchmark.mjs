#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import puppeteer from 'puppeteer';

import { compileCompositionDocumentToTsx, computeDocumentTimeline } from '../packages/core/dist/index.js';
import { render } from '../packages/renderer/dist/index.js';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'benchmarks', 'render-baseline.json');
const defaultReportPath = path.join(root, 'output', 'benchmarks', 'latest.json');
const width = 1280;
const height = 720;
const fps = 30;

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`--${name} requires a value.`);
  return value;
}

function positiveInteger(name, fallback) {
  const value = Number(argument(name, fallback));
  if (!Number.isInteger(value) || value < 1) throw new Error(`--${name} requires a positive integer.`);
  return value;
}

function percentile(values, ratio) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))];
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

async function processSnapshot() {
  if (process.platform === 'win32') {
    const command = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,WorkingSetSize | ConvertTo-Json -Compress';
    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', command], {
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout || '[]');
    return (Array.isArray(parsed) ? parsed : [parsed]).map((entry) => ({
      pid: Number(entry.ProcessId),
      ppid: Number(entry.ParentProcessId),
      rssBytes: Number(entry.WorkingSetSize) || 0,
    }));
  }

  const { stdout } = await execFileAsync('ps', ['-e', '-o', 'pid=,ppid=,rss='], {
    maxBuffer: 8 * 1024 * 1024,
  });
  return stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => {
    const [pid, ppid, rssKb] = line.trim().split(/\s+/).map(Number);
    return { pid, ppid, rssBytes: (rssKb || 0) * 1024 };
  });
}

function processTreeBytes(snapshot, rootPid) {
  const descendants = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of snapshot) {
      if (!descendants.has(entry.pid) && descendants.has(entry.ppid)) {
        descendants.add(entry.pid);
        changed = true;
      }
    }
  }
  return snapshot.reduce((sum, entry) => descendants.has(entry.pid) ? sum + entry.rssBytes : sum, 0);
}

function startMemorySampler() {
  let peakBytes = process.memoryUsage().rss;
  let sampling = false;
  let stopped = false;
  const sample = async () => {
    if (sampling || stopped) return;
    sampling = true;
    try {
      peakBytes = Math.max(peakBytes, processTreeBytes(await processSnapshot(), process.pid));
    } catch {
      peakBytes = Math.max(peakBytes, process.memoryUsage().rss);
    } finally {
      sampling = false;
    }
  };
  const timer = setInterval(sample, 500);
  void sample();
  return async () => {
    stopped = true;
    clearInterval(timer);
    while (sampling) await new Promise((resolve) => setTimeout(resolve, 20));
    return peakBytes;
  };
}

async function createBrowserVideo(workDir) {
  const target = path.join(workDir, 'browser-source.mp4');
  await execFileAsync(ffmpegInstaller.path, [
    '-y', '-f', 'lavfi', '-i', `testsrc2=size=${width}x${height}:rate=${fps}:duration=4`,
    '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', target,
  ], { windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  return pathToFileURL(target).href;
}

function fixtures(browserVideo) {
  const code = {
    type: 'code', id: 'code', language: 'typescript', duration: 90,
    source: [
      'type Beat = { cue: string; target: string };',
      '',
      'export function align(beat: Beat) {',
      '  return {',
      '    narration: beat.cue,',
      '    visual: beat.target,',
      '  };',
      '}',
    ].join('\n'),
    steps: [
      { at: 0, action: 'focus', range: { startLine: 1, endLine: 1 } },
      { at: 30, action: 'focus', range: { startLine: 3, endLine: 7 } },
      { at: 60, action: 'annotate', targetId: 'code:L5', text: 'same beat' },
    ],
  };
  const terminal = {
    type: 'terminal', id: 'terminal', duration: 90, cols: 80, rows: 20,
    renderOptions: { title: 'Seqvio benchmark', presentation: 'vhs', cursorBlink: false },
    events: [
      { timeMs: 0, kind: 'stdout', text: '$ ' },
      { timeMs: 250, kind: 'stdin', text: 'seqvio render demo.tsx', transient: true },
      { timeMs: 1050, kind: 'stdout', text: 'seqvio render demo.tsx\r\nPreparing 720p composition...\r\n' },
      { timeMs: 1800, kind: 'stdout', text: 'Rendered 90/90 frames\r\nSaved output/demo.mp4\r\n$ ' },
    ],
    steps: [
      { id: 'command', label: 'Render the composition', timeMs: 250 },
      { id: 'result', label: 'Confirm the output', timeMs: 1800 },
    ],
  };
  const browser = {
    type: 'browser', id: 'browser', duration: 90, sourceVideo: browserVideo,
    recordingWidth: width, recordingHeight: height, maxZoom: 1.8,
    cursorPoints: [
      { timeMs: 0, x: 180, y: 130 },
      { timeMs: 1500, x: 820, y: 430 },
      { timeMs: 2800, x: 1060, y: 610 },
    ],
    focusTargets: [
      { timeMs: 500, x: 520, y: 260, width: 420, height: 250 },
      { timeMs: 2400, x: 0, y: 0, width: 0, height: 0, reset: true },
    ],
    clicks: [{ timeMs: 1700, x: 820, y: 430 }],
  };
  return { code, terminal, browser };
}

function documents(browserVideo) {
  const scene = fixtures(browserVideo);
  const base = { version: '2.0', width, height, fps, lockToAudio: false, backgroundColor: '#ffffff' };
  const definitions = [
    { name: 'code-720p', document: { ...base, id: 'benchmark-code', scenes: [scene.code] } },
    { name: 'terminal-720p', document: { ...base, id: 'benchmark-terminal', scenes: [scene.terminal] } },
    { name: 'browser-720p', document: { ...base, id: 'benchmark-browser', scenes: [scene.browser] } },
    {
      name: 'mixed-720p',
      document: {
        ...base, id: 'benchmark-mixed', transitionDuration: 6,
        scenes: [
          { ...scene.code, id: 'mixed-code', duration: 30 },
          { ...scene.terminal, id: 'mixed-terminal', duration: 30 },
          { ...scene.browser, id: 'mixed-browser', duration: 30 },
        ],
      },
    },
  ];
  return definitions.map((definition) => ({
    ...definition,
    frames: computeDocumentTimeline(definition.document).totalFrames,
  }));
}

async function environment() {
  let chromiumVersion = 'unknown';
  try {
    const { stdout, stderr } = await execFileAsync(puppeteer.executablePath(), ['--version'], { windowsHide: true });
    chromiumVersion = `${stdout}${stderr}`.trim() || 'unknown';
  } catch {}
  if (chromiumVersion === 'unknown') {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      try {
        chromiumVersion = await browser.version();
      } finally {
        await browser.close();
      }
    } catch {}
  }
  let puppeteerVersion = 'unknown';
  try {
    const packageJson = JSON.parse(await readFile(path.join(root, 'node_modules', 'puppeteer', 'package.json'), 'utf8'));
    puppeteerVersion = packageJson.version ?? 'unknown';
  } catch {}
  let ffmpegVersion = 'unknown';
  try {
    const { stdout } = await execFileAsync(ffmpegInstaller.path, ['-version'], { windowsHide: true });
    ffmpegVersion = stdout.split(/\r?\n/, 1)[0].trim();
  } catch {}
  return {
    platform: process.platform,
    release: os.release(),
    arch: process.arch,
    node: process.version,
    cpuModel: os.cpus()[0]?.model ?? 'unknown',
    logicalCpus: os.cpus().length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    puppeteer: puppeteerVersion,
    chromium: chromiumVersion,
    ffmpeg: ffmpegVersion,
  };
}

async function runCase(definition, workDir, runIndex) {
  const component = path.join(workDir, `${definition.name}.tsx`);
  const output = path.join(workDir, `${definition.name}-run-${runIndex}.mp4`);
  await writeFile(component, compileCompositionDocumentToTsx(definition.document).code, 'utf8');
  const stopMemorySampler = startMemorySampler();
  const result = await render({
    component, output, width, height, fps, duration: definition.frames,
    quality: 'low', pixelRatio: 1, frameFormat: 'png', workers: 1,
    staticFrameDedup: true, tempDir: path.join(workDir, 'render-temp'),
  }, () => {});
  const peakBytes = await stopMemorySampler();
  const outputStat = await stat(output);
  return {
    totalFrames: result.totalFrames,
    videoDurationMs: Math.round((result.totalFrames / fps) * 1000),
    totalMs: result.totalMs,
    renderFactor: result.totalMs / ((result.totalFrames / fps) * 1000),
    renderedFps: result.renderedFps,
    preparationMs: result.phaseMs.setup,
    phaseMs: result.phaseMs,
    peakProcessTreeRssMb: peakBytes / 1024 / 1024,
    outputBytes: outputStat.size,
    reusedFrames: result.reusedFrames,
    cacheHitRate: result.cacheHitRate,
  };
}

function summarize(definition, samples) {
  const metric = (name) => median(samples.map((sample) => sample[name]));
  return {
    name: definition.name,
    width, height, fps, frames: definition.frames,
    sampleCount: samples.length,
    median: {
      totalMs: Math.round(metric('totalMs')),
      renderFactor: Number(metric('renderFactor').toFixed(3)),
      renderedFps: Number(metric('renderedFps').toFixed(3)),
      preparationMs: Math.round(metric('preparationMs')),
      peakProcessTreeRssMb: Number(metric('peakProcessTreeRssMb').toFixed(1)),
      outputBytes: Math.round(metric('outputBytes')),
      reusedFrames: Math.round(metric('reusedFrames')),
      cacheHitRate: Number(metric('cacheHitRate').toFixed(4)),
    },
    p90: {
      totalMs: Math.round(percentile(samples.map((sample) => sample.totalMs), 0.9)),
      peakProcessTreeRssMb: Number(percentile(samples.map((sample) => sample.peakProcessTreeRssMb), 0.9).toFixed(1)),
    },
    samples,
  };
}

function compatibleEnvironment(left, right) {
  return left.platform === right.platform && left.arch === right.arch && left.cpuModel === right.cpuModel;
}

function compare(report, baseline) {
  if (!compatibleEnvironment(report.environment, baseline.environment)) {
    return { compatible: false, ok: true, regressions: [], message: 'Environment differs from the stored reference; metrics are reported without enforcing budgets.' };
  }
  const tolerance = baseline.tolerance ?? {};
  const regressions = [];
  for (const expected of baseline.cases) {
    const actual = report.cases.find((entry) => entry.name === expected.name);
    if (!actual) {
      regressions.push(`${expected.name}: missing benchmark case`);
      continue;
    }
    for (const [metric, ratio] of Object.entries({
      renderFactor: tolerance.renderFactorRatio ?? 0.4,
      preparationMs: tolerance.preparationRatio ?? 0.3,
      peakProcessTreeRssMb: tolerance.peakMemoryRatio ?? 0.35,
      outputBytes: tolerance.outputSizeRatio ?? 0.5,
    })) {
      const limit = expected.median[metric] * (1 + ratio);
      if (actual.median[metric] > limit) {
        regressions.push(`${actual.name}: ${metric} ${actual.median[metric]} exceeds ${Number(limit.toFixed(3))}`);
      }
    }
    const allowedCacheDrop = tolerance.cacheHitRateAbsoluteDrop ?? 0.05;
    if (actual.median.cacheHitRate < expected.median.cacheHitRate - allowedCacheDrop) {
      regressions.push(`${actual.name}: cacheHitRate ${actual.median.cacheHitRate} fell below ${(expected.median.cacheHitRate - allowedCacheDrop).toFixed(4)}`);
    }
  }
  return { compatible: true, ok: regressions.length === 0, regressions };
}

async function main() {
  const check = hasFlag('check');
  const updateBaseline = hasFlag('update-baseline');
  const runs = positiveInteger('runs', check || updateBaseline ? 3 : 1);
  const selected = new Set(argument('case', '').split(',').filter(Boolean));
  const reportPath = path.resolve(root, argument('output', path.relative(root, defaultReportPath)));
  const tempRoot = path.join(root, 'temp');
  await mkdir(tempRoot, { recursive: true });
  const workDir = await mkdtemp(path.join(tempRoot, 'render-benchmark-'));
  try {
    const browserVideo = await createBrowserVideo(workDir);
    const definitions = documents(browserVideo).filter((entry) => selected.size === 0 || selected.has(entry.name));
    if (definitions.length === 0) throw new Error('No benchmark case matched --case.');
    const report = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      profile: { width, height, fps, quality: 'low', pixelRatio: 1, frameFormat: 'png', workers: 1 },
      environment: await environment(),
      cases: [],
    };
    for (const definition of definitions) {
      const samples = [];
      for (let runIndex = 1; runIndex <= runs; runIndex += 1) {
        process.stdout.write(`Benchmark ${definition.name} (${runIndex}/${runs})... `);
        const sample = await runCase(definition, workDir, runIndex);
        samples.push(sample);
        console.log(`${sample.renderFactor.toFixed(2)}x realtime, ${sample.peakProcessTreeRssMb.toFixed(0)} MiB peak`);
      }
      report.cases.push(summarize(definition, samples));
    }
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Benchmark report: ${reportPath}`);

    if (updateBaseline) {
      const baseline = {
        ...report,
        tolerance: {
          renderFactorRatio: 0.4,
          preparationRatio: 0.3,
          peakMemoryRatio: 0.35,
          outputSizeRatio: 0.5,
          cacheHitRateAbsoluteDrop: 0.05,
        },
      };
      await mkdir(path.dirname(baselinePath), { recursive: true });
      await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
      console.log(`Updated reference baseline: ${baselinePath}`);
    }

    if (check) {
      const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
      const comparison = compare(report, baseline);
      if (!comparison.compatible) console.log(comparison.message);
      if (!comparison.ok) throw new Error(`Performance budget failed:\n${comparison.regressions.join('\n')}`);
      if (comparison.compatible) console.log('Performance budget passed.');
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
