#!/usr/bin/env node
/**
 * seqvio-qa — render key-frame snapshots and emit a lightweight visual report.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'node:crypto';
import puppeteer from 'puppeteer';
import {
  scanCaptureManifestForSecrets,
  validateCaptureManifest,
  type CaptureManifest,
} from '@seqvio/capture';
import { runtimeGlobalName } from './brand';
import { disposeRenderShell, getMetaFromPage, loadRenderShell, setFrameAndWait } from './browser-shell';
import { bundleScene, resolveComponentPath, writeRenderShell } from './bundle-scene';
import {
  resolveCompositionDurationFrames,
  resolveNarrationCueTimes,
  resolvePacingProfile,
} from './media-contract';
import { buildManifestFromMeta, loadAudioManifest, validateAudioManifest } from './audio/manifest';
import { inspectAudioFile } from './audio-health';
import {
  classifyQaRuntimeError,
  diagnosePacing,
  expectedNarrationTrackDurationMs,
  promoteQaWarnings,
  type QaDiagnostic,
  type QaProfile,
} from './qa-diagnostics';
import {
  applyQaSuppressions,
  loadQaConfig,
  QA_CONFIG_VERSION,
  type QaConfig,
} from './qa-policy';

interface QaOptions {
  component: string;
  outDir: string;
  width: number;
  height: number;
  fps?: number;
  duration?: number;
  frames?: number[];
  pixelRatio: number;
  blankThreshold: number;
  ci?: boolean;
  profile: QaProfile;
  captureManifest?: string;
  audioManifest?: string;
  warningCodes: Set<string>;
  keepArtifacts: boolean;
  allowSilentNarration: boolean;
  qaConfig?: string;
}

interface SnapshotReport {
  frame: number;
  file: string;
  width: number;
  height: number;
  elementCount: number;
  bodyTextLength: number;
  nonWhiteRatio: number;
  textOverflowCount: number;
  smallFontCount: number;
  lowContrastCount: number;
  pixelHash: string;
  issues: QaDiagnostic[];
}

function printUsage(): void {
  console.log(`Usage:
  seqvio-qa --component <path> --outDir <path> [options]

Options:
  --component <path>       TSX composition to inspect (required)
  --outDir <path>          Snapshot/report output directory (required)
  --width <n>              Viewport width (default: 1280)
  --height <n>             Viewport height (default: 720)
  --fps <n>                Override fps
  --duration <n>           Override total duration in frames
  --frames <csv>           Frames to inspect, e.g. 0,60,120
  --pixelRatio <n>         Screenshot device scale factor (default: 1)
  --blankThreshold <n>     Minimum non-white pixel ratio (default: 0.01)
  --profile <name>         QA profile: baseline | capture (default: baseline)
  --captureManifest <path> CaptureManifest JSON used by the capture profile
  --audioManifest <path>   Resolved audio manifest used for final timing QA
  --qaConfig <path>        Versioned QA config with pacing profile and suppressions
  --warningsAsErrors <csv> Promote selected warning codes to errors
  --failOnWarning          Promote every warning to an error
  --keepArtifacts          Keep intermediate browser artifacts
  --allowSilentNarration   Permit an explicitly silent capture job without a narration track
  --ci                     CI mode (exit non-zero on error; machine-readable report)
  --help
`);
}

function parseArgs(argv: string[]): QaOptions {
  const args = new Map<string, string | boolean>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'help' || key === 'ci' || key === 'failOnWarning' || key === 'keepArtifacts' || key === 'allowSilentNarration') {
      args.set(key, true);
      continue;
    }
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    args.set(key, value);
    i += 1;
  }

  if (args.get('help')) {
    printUsage();
    process.exit(0);
  }

  const component = args.get('component');
  const outDir = args.get('outDir');
  if (typeof component !== 'string' || typeof outDir !== 'string') {
    printUsage();
    throw new Error('Both --component and --outDir are required');
  }

  const framesArg = args.get('frames');
  const frames =
    typeof framesArg === 'string'
      ? framesArg
          .split(',')
          .map((part) => Number(part.trim()))
          .filter((frame) => Number.isFinite(frame) && frame >= 0)
      : undefined;
  const profileArg = args.get('profile');
  const profile = profileArg === undefined ? 'baseline' : profileArg;
  if (profile !== 'baseline' && profile !== 'capture') {
    throw new Error('--profile must be "baseline" or "capture"');
  }
  const captureManifest = args.get('captureManifest');
  const audioManifest = args.get('audioManifest');
  const qaConfig = args.get('qaConfig');
  const warningCodesArg = args.get('warningsAsErrors');
  const warningCodes = new Set(typeof warningCodesArg === 'string' ? warningCodesArg.split(',').map((code) => code.trim()).filter(Boolean) : []);
  if (args.get('failOnWarning') === true) warningCodes.add('*');

  return {
    component: path.resolve(component),
    outDir: path.resolve(outDir),
    width: args.get('width') ? Number(args.get('width')) : 1280,
    height: args.get('height') ? Number(args.get('height')) : 720,
    fps: args.get('fps') ? Number(args.get('fps')) : undefined,
    duration: args.get('duration') ? Number(args.get('duration')) : undefined,
    frames,
    pixelRatio: args.get('pixelRatio') ? Number(args.get('pixelRatio')) : 1,
    blankThreshold: args.get('blankThreshold') ? Number(args.get('blankThreshold')) : 0.01,
    ci: args.get('ci') === true,
    profile,
    captureManifest:
      typeof captureManifest === 'string' ? path.resolve(captureManifest) : undefined,
    audioManifest: typeof audioManifest === 'string' ? path.resolve(audioManifest) : undefined,
    warningCodes,
    keepArtifacts: args.get('keepArtifacts') === true,
    allowSilentNarration: args.get('allowSilentNarration') === true,
    qaConfig: typeof qaConfig === 'string' ? path.resolve(qaConfig) : undefined,
  };
}

function writeQaReport(outDir: string, report: Record<string, unknown>): string {
  fs.mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, 'qa-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

function loadCapturePreflight(options: QaOptions): QaDiagnostic[] {
  const diagnostics: QaDiagnostic[] = [];
  if (!options.captureManifest) {
    if (options.profile === 'capture') {
      diagnostics.push({
        severity: 'error',
        code: 'missing_capture_manifest',
        path: 'captureManifest',
        message: 'The capture QA profile requires --captureManifest.',
        repair: 'Pass the CaptureManifest JSON produced by the recording adapter.',
      });
    }
    return diagnostics;
  }

  const manifest = JSON.parse(fs.readFileSync(options.captureManifest, 'utf8')) as CaptureManifest;
  diagnostics.push(
    ...validateCaptureManifest(manifest, {
      requireCapturedState: options.profile === 'capture',
      checkMediaFiles: true,
      baseDir: path.dirname(options.captureManifest),
    }),
  );
  diagnostics.push(...scanCaptureManifestForSecrets(manifest));
  return diagnostics;
}

function validateMediaForQa(
  meta: Awaited<ReturnType<typeof getMetaFromPage>>,
  fps: number,
  duration: number,
  profile: QaProfile,
  componentDir: string,
  requireNarrationAudio: boolean,
): QaDiagnostic[] {
  const diagnostics: QaDiagnostic[] = [];
  const manifest = buildManifestFromMeta(meta);
  if (!manifest) return diagnostics;
  diagnostics.push(...validateAudioManifest(manifest, { baseDir: componentDir }));

  const durationMs = (duration / Math.max(1, fps)) * 1000;
  for (const [index, cue] of (manifest.narration ?? []).entries()) {
    const times = resolveNarrationCueTimes(cue, fps);
    if (times.endMs > durationMs + 1) {
      diagnostics.push({
        severity: 'error',
        code: 'narration_after_duration',
        path: `narration[${index}]`,
        message: `Narration cue "${cue.id}" extends beyond the composition duration.`,
        repair: 'Extend the scene duration or shorten/reschedule the narration cue.',
      });
    }
  }
  for (const [index, cue] of (manifest.captions ?? []).entries()) {
    if (cue.endMs > durationMs + 1) {
      diagnostics.push({
        severity: 'error',
        code: 'caption_after_duration',
        path: `captions[${index}]`,
        message: `Caption "${cue.text}" extends beyond the composition duration.`,
        repair: 'Clamp the caption to the resolved video timeline.',
      });
    }
  }
  if (
    profile === 'capture' && requireNarrationAudio &&
    (manifest.narration?.some((cue) => !cue.silent) ?? false) &&
    !(manifest.tracks?.some((track) => track.kind === 'narration') ?? false)
  ) {
    diagnostics.push({
      severity: 'error',
      code: 'missing_narration_audio',
      path: 'audio.tracks',
      message: 'Capture profile has spoken narration cues but no narration audio track.',
      repair: 'Synthesize narration and attach the resolved narration track before release QA.',
    });
  }
  return diagnostics;
}

async function inspectAudioTracksForQa(
  meta: Awaited<ReturnType<typeof getMetaFromPage>>,
  componentDir: string,
): Promise<QaDiagnostic[]> {
  const manifest = buildManifestFromMeta(meta);
  if (!manifest?.tracks?.length) return [];
  const diagnostics: QaDiagnostic[] = [];
  for (const [index, track] of manifest.tracks.entries()) {
    if (track.kind !== 'narration' || !track.src) continue;
    const source = path.isAbsolute(track.src)
      ? track.src
      : path.resolve(componentDir, track.src);
    const expectedDurationMs = expectedNarrationTrackDurationMs(meta, track.id, meta.fps ?? 30);
    diagnostics.push(
      ...(await inspectAudioFile(source, `audio.tracks[${index}].src`, expectedDurationMs)),
    );
  }
  return diagnostics;
}

function defaultFrames(duration: number): number[] {
  const maxFrame = Math.max(0, duration - 1);
  return Array.from(
    new Set([
      0,
      Math.round(maxFrame * 0.25),
      Math.round(maxFrame * 0.5),
      Math.round(maxFrame * 0.75),
      maxFrame,
    ])
  );
}

async function analyzePngWithCanvas(
  page: import('puppeteer').Page,
  base64Png: string,
  blankThreshold: number
): Promise<Pick<SnapshotReport, 'nonWhiteRatio' | 'issues'>> {
  const ratio = await page.evaluate(async (dataUrl) => {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return 0;
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let nonWhite = 0;
    const total = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 8 && !(r > 248 && g > 248 && b > 248)) nonWhite += 1;
    }
    return nonWhite / total;
  }, `data:image/png;base64,${base64Png}`);

  const issues: SnapshotReport['issues'] = [];
  if (ratio < blankThreshold) {
    issues.push({
      severity: 'error',
      code: 'mostly_blank_frame',
      message: `Frame appears mostly blank (${ratio.toFixed(4)} non-white pixels).`,
    });
  }

  return { nonWhiteRatio: ratio, issues };
}

async function inspectDom(page: import('puppeteer').Page): Promise<{
  elementCount: number;
  bodyTextLength: number;
  bodyText: string;
  outOfBoundsCount: number;
  textOverflowCount: number;
  smallFontCount: number;
  lowContrastCount: number;
}> {
  return page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('#root *'));
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    let outOfBoundsCount = 0;
    let textOverflowCount = 0;
    let smallFontCount = 0;
    let lowContrastCount = 0;
    const MIN_FONT_PX = 12;
    const MIN_CONTRAST = 4.5;

    const parseColor = (css: string): [number, number, number] | null => {
      const m = css.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
      if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null;
      return [parts[0], parts[1], parts[2]];
    };
    const luminance = (rgb: [number, number, number]): number => {
      const linear = rgb.map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const contrastRatio = (
      a: [number, number, number],
      b: [number, number, number]
    ): number => {
      const la = luminance(a);
      const lb = luminance(b);
      const lighter = Math.max(la, lb);
      const darker = Math.min(la, lb);
      return (lighter + 0.05) / (darker + 0.05);
    };

    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (
        rect.right < -2 ||
        rect.bottom < -2 ||
        rect.left > viewport.width + 2 ||
        rect.top > viewport.height + 2
      ) {
        outOfBoundsCount += 1;
      }
      // text overflow: content overflows the element's box
      if (
        element.scrollHeight > element.clientHeight + 1 ||
        element.scrollWidth > element.clientWidth + 1
      ) {
        textOverflowCount += 1;
      }
      const style = window.getComputedStyle(element);
      const text = (element.textContent || '').trim();
      // font size floor (only for elements with text)
      const fontSize = parseFloat(style.fontSize);
      if (fontSize > 0 && fontSize < MIN_FONT_PX && text.length > 0) {
        smallFontCount += 1;
      }
      // contrast (only for elements with text and a non-transparent background)
      if (text.length > 0) {
        const fg = parseColor(style.color);
        const bg = parseColor(style.backgroundColor);
        if (fg && bg && contrastRatio(fg, bg) < MIN_CONTRAST) {
          lowContrastCount += 1;
        }
      }
    }
    return {
      elementCount: elements.length,
      bodyTextLength: document.body.innerText.trim().length,
      bodyText: document.body.innerText.trim(),
      outOfBoundsCount,
      textOverflowCount,
      smallFontCount,
      lowContrastCount,
    };
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const qaConfig: QaConfig = options.qaConfig
    ? loadQaConfig(options.qaConfig)
    : { version: QA_CONFIG_VERSION, suppressions: [] };
  fs.mkdirSync(options.outDir, { recursive: true });
  const preflightIssues = loadCapturePreflight(options);
  if (preflightIssues.some((issue) => issue.severity === 'error')) {
    const reportPath = writeQaReport(options.outDir, {
      ok: false,
      profile: options.profile,
      component: options.component,
      snapshots: [],
      issues: preflightIssues,
    });
    console.error(`seqvio-qa preflight failed. Wrote ${reportPath}`);
    process.exitCode = 1;
    return;
  }

  const tempDir = path.join(options.outDir, '.tmp');
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const resolvedComponent = resolveComponentPath(options.component);
  const resolvedAudioManifest = options.audioManifest
    ? loadAudioManifest(options.audioManifest)
    : undefined;
  const bundle = await bundleScene({
    componentPath: resolvedComponent,
    outDir: tempDir,
    width: options.width,
    height: options.height,
    fps: options.fps,
    duration: options.duration,
    resolvedAudioManifest: resolvedAudioManifest?.manifest,
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--allow-file-access-from-files',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: options.width,
    height: options.height,
    deviceScaleFactor: options.pixelRatio,
  });
  await loadRenderShell(page, bundle.shellPath);

  const meta = await getMetaFromPage(page);
  const width = meta.width ?? options.width;
  const height = meta.height ?? options.height;
  if (width !== options.width || height !== options.height) {
    await disposeRenderShell(page);
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: options.pixelRatio,
    });
    await loadRenderShell(page, writeRenderShell(tempDir, width, height));
  }

  const fps = Math.max(1, options.fps ?? meta.fps ?? 30);
  const duration = resolveCompositionDurationFrames(
    options.duration ?? meta.duration,
    fps,
    meta.audio,
    meta.captions
  );
  const mediaIssues = validateMediaForQa(
    meta,
    fps,
    duration,
    options.profile,
    resolvedAudioManifest?.baseDir ?? path.dirname(resolvedComponent),
    !options.allowSilentNarration,
  );
  const authoredPacingProfile = meta.audio?.pacingProfile ?? meta.pacing?.profile;
  const resolvedPacingProfile = resolvePacingProfile(qaConfig.pacingProfile ?? authoredPacingProfile).id;
  const pacingIssues = diagnosePacing(meta, fps, resolvedPacingProfile);
  if (qaConfig.pacingProfile && authoredPacingProfile && qaConfig.pacingProfile !== authoredPacingProfile) {
    pacingIssues.push({
      severity: 'warning',
      code: 'pacing_profile_override',
      path: 'pacingProfile',
      message: `QA profile "${qaConfig.pacingProfile}" overrides authored profile "${authoredPacingProfile}".`,
      repair: 'Regenerate the composition with the release pacing profile to keep authoring and QA aligned.',
    });
  }
  const audioHealthIssues = await inspectAudioTracksForQa(
    meta,
    resolvedAudioManifest?.baseDir ?? path.dirname(resolvedComponent),
  );
  const frames = options.frames?.length ? options.frames : defaultFrames(duration);

  const reports: SnapshotReport[] = [];
  for (const frame of frames) {
    const sourceFrame = Math.min(frame, Math.max(0, duration - 1));
    await setFrameAndWait(page, sourceFrame);
    const dom = await inspectDom(page);
    const buffer = (await page.screenshot({
      type: 'png',
      omitBackground: false,
    })) as Buffer;
    const fileName = `frame-${String(sourceFrame).padStart(6, '0')}.png`;
    const filePath = path.join(options.outDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const imageAnalysis = await analyzePngWithCanvas(
      page,
      buffer.toString('base64'),
      options.blankThreshold
    );
    const issues = [...imageAnalysis.issues];
    if (dom.elementCount === 0) {
      issues.push({
        severity: 'error',
        code: 'empty_dom',
        message: 'No rendered DOM elements were found under #root.',
        repair: 'Ensure the scene renders content under #root at this frame.',
      });
    }
    if (dom.outOfBoundsCount > 0) {
      issues.push({
        severity: 'warning',
        code: 'offscreen_elements',
        message: `${dom.outOfBoundsCount} element(s) have visible bounds outside the viewport.`,
        repair: 'Move or resize elements to stay within the viewport.',
      });
    }
    if (dom.textOverflowCount > 0) {
      issues.push({
        severity: 'warning',
        code: 'text_overflow',
        message: `${dom.textOverflowCount} element(s) overflow their container.`,
        repair: 'Increase container size, reduce text, or enable wrapping/scroll.',
      });
    }
    if (dom.smallFontCount > 0) {
      issues.push({
        severity: 'warning',
        code: 'small_font',
        message: `${dom.smallFontCount} element(s) use font-size below 12px.`,
        repair: 'Increase font-size to at least 12px.',
      });
    }
    if (dom.lowContrastCount > 0) {
      issues.push({
        severity: 'warning',
        code: 'low_contrast',
        message: `${dom.lowContrastCount} element(s) have foreground/background contrast below WCAG AA (4.5:1).`,
        repair: 'Increase foreground/background contrast to at least 4.5:1.',
      });
    }

    // narration/visual agreement: the current cue's keywords should overlap
    // with the visible text. Catches the common AI-video failure where the
    // voice and the picture explain two different things.
    const narrationCues = meta.audio?.narration ?? [];
    const frameTimeMs = (sourceFrame / fps) * 1000;
    const currentCue = narrationCues.find(
      (c) => frameTimeMs >= (c.startMs ?? 0) && frameTimeMs < (c.endMs ?? Infinity)
    );
    if (currentCue && dom.bodyText) {
      const cueWords = currentCue.text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3 && /[a-z一-龥]/.test(w));
      const bodyLower = dom.bodyText.toLowerCase();
      const matched = cueWords.filter((w) => bodyLower.includes(w));
      if (cueWords.length > 0 && matched.length === 0) {
        issues.push({
          severity: 'warning',
          code: 'narration_visual_mismatch',
          message: `Narration cue "${currentCue.text.slice(0, 50)}" has no keyword overlap with visible text at frame ${sourceFrame}.`,
          repair: 'Ensure the narration describes what is visible on screen at this frame.',
        });
      }
    }

    reports.push({
      frame: sourceFrame,
      file: filePath,
      width,
      height,
      elementCount: dom.elementCount,
      bodyTextLength: dom.bodyTextLength,
      nonWhiteRatio: imageAnalysis.nonWhiteRatio,
      textOverflowCount: dom.textOverflowCount,
      smallFontCount: dom.smallFontCount,
      lowContrastCount: dom.lowContrastCount,
      pixelHash: createHash('sha256').update(buffer).digest('hex'),
      issues,
    });
  }

  await disposeRenderShell(page);
  await browser.close();

  const temporalIssues: QaDiagnostic[] = [];
  if (
    options.profile === 'capture' &&
    reports.length > 1 &&
    new Set(reports.map((report) => report.pixelHash)).size === 1
  ) {
    temporalIssues.push({
      severity: 'warning',
      code: 'no_visual_change',
      message: 'All sampled capture frames are pixel-identical.',
      repair: 'Verify capture timestamps and ensure recorded actions produce visible state changes.',
    });
  }
  const rawIssues: QaDiagnostic[] = [
    ...preflightIssues,
    ...mediaIssues,
    ...pacingIssues,
    ...audioHealthIssues,
    ...temporalIssues,
    ...reports.flatMap((report) =>
      report.issues.map((issue) => ({
        frame: report.frame,
        ...issue,
        path: issue.path ?? `snapshots[${report.frame}]`,
      }))
    ),
  ];
  const suppressionResult = applyQaSuppressions(rawIssues, qaConfig.suppressions ?? []);
  const allIssues = promoteQaWarnings(suppressionResult.active, options.warningCodes);
  const ok = !allIssues.some((issue) => issue.severity === 'error');
  const report = {
    ok,
    profile: options.profile,
    qaConfigVersion: qaConfig.version,
    pacingProfile: resolvedPacingProfile,
    component: resolvedComponent,
    fps,
    duration,
    snapshots: reports,
    issues: allIssues,
    suppressedIssues: suppressionResult.suppressed,
    unusedSuppressions: suppressionResult.unused,
    promotedWarnings: [...options.warningCodes],
  };
  const reportPath = writeQaReport(options.outDir, report);
  if (!ok || options.keepArtifacts) {
    const retainedDir = path.join(options.outDir, 'qa-artifacts');
    fs.rmSync(retainedDir, { recursive: true, force: true });
    if (fs.existsSync(tempDir)) fs.renameSync(tempDir, retainedDir);
    fs.mkdirSync(retainedDir, { recursive: true });
    fs.writeFileSync(path.join(retainedDir, 'retention.json'), `${JSON.stringify({ reason: ok ? 'explicit' : 'qa_failure', reportPath }, null, 2)}\n`, 'utf8');
  } else {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`Wrote QA snapshots to ${options.outDir}`);
  console.log(`Wrote QA report to ${reportPath}`);
  if (!ok) {
    console.error(`seqvio-qa found ${allIssues.length} issue(s).`);
    process.exit(1);
  }
  console.log(`seqvio-qa passed (${reports.length} snapshot(s)).`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  const argv = process.argv.slice(2);
  const outDirIndex = argv.indexOf('--outDir');
  const outDir = outDirIndex >= 0 ? argv[outDirIndex + 1] : undefined;
  if (outDir) {
    const resolvedOutDir = path.resolve(outDir);
    const reportPath = writeQaReport(resolvedOutDir, {
      ok: false,
      profile: argv.includes('capture') ? 'capture' : 'baseline',
      snapshots: [],
      issues: [{
        severity: 'error',
        code: classifyQaRuntimeError(message),
        message,
      }],
    });
    console.error(`Wrote QA failure report to ${reportPath}`);
  }
  console.error(`seqvio-qa failed: ${message}`);
  process.exitCode = 1;
});
