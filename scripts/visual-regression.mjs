#!/usr/bin/env node
/**
 * Visual regression harness for Seqvio compositions.
 *
 * Renders a fixed set of key frames for each tracked composition and compares
 * them against committed baseline PNGs using FFmpeg's PSNR filter (no extra
 * runtime dependencies — reuses the bundled @ffmpeg-installer binary).
 *
 * Usage:
 *   node scripts/visual-regression.mjs            # compare against baselines
 *   node scripts/visual-regression.mjs --update   # (re)generate baselines
 *
 * Exit code is non-zero when any frame falls below the PSNR threshold, so it
 * doubles as the regression net for the P0 refactors (layering + streaming
 * renderer) where the guarantee is "rendered output does not change".
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const rendererCli = path.join(repoRoot, 'packages', 'renderer', 'dist', 'cli.js');
const baselineDir = path.join(repoRoot, 'tests', 'visual-snapshots', 'baseline');
const workDir = path.join(repoRoot, 'tests', 'visual-snapshots', '.work');

/**
 * Tracked compositions and the source frames to snapshot. Frames are chosen to
 * straddle scene boundaries / transitions where regressions are most likely.
 */
const CASES = [
  {
    name: 'overview-en',
    component: 'examples/compositions/seqvio-overview-en.tsx',
    width: 1280,
    height: 720,
    frames: [0, 30, 90, 150],
  },
  {
    name: 'overview-zh',
    component: 'examples/compositions/seqvio-overview-zh.tsx',
    width: 1280,
    height: 720,
    frames: [0, 30, 90, 150],
  },
  {
    name: 'intro',
    component: 'examples/compositions/seqvio-intro.tsx',
    width: 1280,
    height: 720,
    frames: [0, 24, 60],
  },
];

// PSNR below this (dB) for any frame is treated as a regression. Pixel-identical
// frames report "inf"; anti-aliasing jitter across machines stays well above 40.
const PSNR_THRESHOLD_DB = 40;

const isUpdate = process.argv.includes('--update');

function frameFileName(caseName, frame) {
  return `${caseName}-f${String(frame).padStart(6, '0')}.png`;
}

/**
 * Render a single source frame of a composition to a PNG at outPath.
 * Uses --startFrame/--endFrame to render exactly one frame and --keepFrames so
 * the intermediate PNG survives, then copies it out before cleanup.
 */
async function renderFrame(testCase, frame, outPath) {
  const tempDir = path.join(workDir, `${testCase.name}-f${frame}`);
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  // Render only the target frame to an mp4 we discard; --keepFrames leaves the
  // captured PNG (named frame-000000.png, since output index restarts at 0).
  const throwawayOut = path.join(tempDir, 'out.mp4');
  await execFileAsync(
    process.execPath,
    [
      rendererCli,
      '--component', path.join(repoRoot, testCase.component),
      '--output', throwawayOut,
      '--width', String(testCase.width),
      '--height', String(testCase.height),
      '--startFrame', String(frame),
      '--endFrame', String(frame),
      '--tempDir', tempDir,
      '--keepFrames',
    ],
    { cwd: repoRoot, maxBuffer: 1024 * 1024 * 16 }
  );

  // The renderer writes frames into a render-<ts>-<rand> subdir of tempDir.
  const captured = findFirstFrame(tempDir);
  if (!captured) {
    throw new Error(`No frame PNG produced for ${testCase.name} frame ${frame}`);
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.copyFileSync(captured, outPath);
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function findFirstFrame(dir) {
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name.startsWith('frame-') && entry.name.endsWith('.png')) {
        return full;
      }
    }
  }
  return null;
}

/**
 * Compare two PNGs via FFmpeg PSNR. Returns the average PSNR in dB
 * (Infinity when identical).
 */
async function comparePsnr(refPath, testPath) {
  let stderr = '';
  try {
    const result = await execFileAsync(
      ffmpegPath,
      [
        '-i', testPath,
        '-i', refPath,
        '-filter_complex', 'psnr',
        '-f', 'null',
        process.platform === 'win32' ? 'NUL' : '/dev/null',
      ],
      { maxBuffer: 1024 * 1024 * 16 }
    );
    stderr = result.stderr;
  } catch (error) {
    // ffmpeg exits 0 here normally; capture stderr either way.
    stderr = error.stderr ?? '';
  }

  const infMatch = /average:inf/i.test(stderr);
  if (infMatch) return Infinity;
  const match = stderr.match(/average:([0-9.]+)/i);
  if (!match) {
    throw new Error(`Could not parse PSNR from ffmpeg output:\n${stderr}`);
  }
  return Number(match[1]);
}

async function main() {
  if (!fs.existsSync(rendererCli)) {
    throw new Error(`Renderer CLI not built: ${rendererCli}\nRun: npm run build`);
  }
  fs.mkdirSync(workDir, { recursive: true });

  const failures = [];
  let compared = 0;

  for (const testCase of CASES) {
    for (const frame of testCase.frames) {
      const fileName = frameFileName(testCase.name, frame);
      const baselinePath = path.join(baselineDir, fileName);

      if (isUpdate) {
        process.stdout.write(`baseline ${fileName} ... `);
        await renderFrame(testCase, frame, baselinePath);
        console.log('written');
        continue;
      }

      if (!fs.existsSync(baselinePath)) {
        failures.push(`${fileName}: no baseline (run with --update first)`);
        continue;
      }

      const candidatePath = path.join(workDir, fileName);
      await renderFrame(testCase, frame, candidatePath);
      const psnr = await comparePsnr(baselinePath, candidatePath);
      compared += 1;
      const ok = psnr >= PSNR_THRESHOLD_DB;
      console.log(`${fileName}: PSNR ${psnr === Infinity ? 'inf' : psnr.toFixed(2)} dB ${ok ? 'OK' : 'FAIL'}`);
      if (!ok) {
        failures.push(`${fileName}: PSNR ${psnr.toFixed(2)} dB < ${PSNR_THRESHOLD_DB} dB`);
      }
    }
  }

  if (isUpdate) {
    console.log('\nBaselines updated.');
    return;
  }

  console.log(`\nCompared ${compared} frame(s).`);
  if (failures.length > 0) {
    console.error(`\nVisual regression FAILED:\n - ${failures.join('\n - ')}`);
    process.exit(1);
  }
  console.log('Visual regression PASSED.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
