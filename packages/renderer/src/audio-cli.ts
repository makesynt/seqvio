#!/usr/bin/env node

import { execFile } from "node:child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import puppeteer from "puppeteer";
import { promisify } from "util";
import {
  msToFrames,
  resolveNarrationCueTimes,
  type CaptionCue,
  type CompositionAudioManifest,
  type NarrationCue,
} from "./media-contract";
import { bundleScene, resolveComponentPath } from "./bundle-scene";
import {
  disposeRenderShell,
  getMetaFromPage,
  loadRenderShell,
} from "./browser-shell";
import {
  buildManifestFromMeta,
  loadAudioManifest,
  reflowSynthesizedTimeline,
  resolveSynthesizedCueTiming,
  validateAudioManifest,
} from "./audio/manifest";
import {
  formatSoundDesignMarkdown,
  loadLocalSoundAssetRegistry,
  planSoundDesign,
  resolveLocalSoundCues,
  validateLocalSoundAssetRegistry,
  validateSoundCueCoverage,
} from "./audio/sound";

type CommandName =
  | "extract"
  | "validate"
  | "synthesize"
  | "plan-sfx"
  | "resolve-sfx"
  | "validate-sfx";
type TtsProvider = "elevenlabs" | "minimax" | "edge-tts" | "openai";

const execFileAsync = promisify(execFile);
const WINDOWS_USER_SCRIPT_DIR = path.join(
  process.env.LOCALAPPDATA ?? "",
  "Packages",
  "PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0",
  "LocalCache",
  "local-packages",
  "Python312",
  "Scripts",
);

function printUsage(): void {
  console.log(`Usage:
  seqvio-audio extract --component <path> --out <path> [options]
  seqvio-audio validate --manifest <path>
  seqvio-audio synthesize --manifest <path> --outDir <path> [options]
  seqvio-audio plan-sfx --manifest <path> --out <path> [options]
  seqvio-audio resolve-sfx --manifest <path> --registry <path> [options]
  seqvio-audio validate-sfx --registry <path> [--manifest <path>]

Commands:
  extract       Read audio/caption metadata from a renderable TSX component
  validate      Validate a manifest JSON file
  synthesize    Synthesize narration cues into MP3 files
  plan-sfx      Write a reviewable local sound-design plan without changing the manifest

Common options:
  --help

extract options:
  --component <path>   Path to TSX/TS composition (required)
  --out <path>         Output manifest JSON path (required)
  --width <number>     Bundle viewport width (default: 1280)
  --height <number>    Bundle viewport height (default: 720)
  --fps <number>       Default FPS if meta omits it (default: 30)
  --duration <number>  Default duration if meta omits it (default: 300)

synthesize options:
  --manifest <path>    Source manifest JSON (required)
  --outDir <path>      Output directory for generated MP3 files (required)
  --outManifest <path> Output manifest path (default: <outDir>/audio-manifest.resolved.json)
  --provider <name>    elevenlabs | minimax | edge-tts | openai (default: elevenlabs)
  --voice <name>       Provider-specific voice ID/name
  --model <name>       Provider-specific model override
  --baseUrl <url>      Override ElevenLabs/OpenAI base URL

resolve-sfx options:
  --manifest <path>    Source audio manifest with ExplanationBeat sounds (required)
  --registry <path>    Local sound registry JSON (required)
  --outManifest <path> Output resolved manifest (default: <manifest>.sfx.resolved.json)

plan-sfx options:
  --manifest <path>    Source audio manifest with ExplanationBeat visuals (required)
  --out <path>         Markdown sound-design plan (required)
  --authoredOnly       Exclude suggested cues derived from visual actions

validate-sfx options:
  --registry <path>    Local sound registry JSON (required)
  --manifest <path>    Optional audio manifest to validate alongside the registry
`);
}

function parseArgs(argv: string[]): {
  command: CommandName | null;
  args: Map<string, string | boolean>;
} {
  const [commandToken, ...rest] = argv;
  const command =
    commandToken === "extract" ||
    commandToken === "validate" ||
    commandToken === "synthesize" ||
    commandToken === "plan-sfx" ||
    commandToken === "resolve-sfx" ||
    commandToken === "validate-sfx"
      ? commandToken
      : null;

  const args = new Map<string, string | boolean>();
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    if (key === "help" || key === "authoredOnly") {
      args.set(key, true);
      continue;
    }
    const value = rest[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    args.set(key, value);
    i += 1;
  }

  return { command, args };
}

function requireString(
  args: Map<string, string | boolean>,
  key: string,
): string {
  const value = args.get(key);
  if (typeof value !== "string") {
    throw new Error(`Missing required --${key}`);
  }
  return value;
}

async function runExtract(args: Map<string, string | boolean>): Promise<void> {
  const component = resolveComponentPath(requireString(args, "component"));
  const outPath = path.resolve(requireString(args, "out"));
  const width = Number(args.get("width") ?? 1280);
  const height = Number(args.get("height") ?? 720);
  const fps = Number(args.get("fps") ?? 30);
  const duration = Number(args.get("duration") ?? 300);

  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "seqvio-audio-extract-"),
  );
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--allow-file-access-from-files",
    ],
  });

  try {
    const bundleResult = await bundleScene({
      componentPath: component,
      outDir: tempDir,
      width,
      height,
      fps,
      duration,
      burnCaptions: false,
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await loadRenderShell(page, bundleResult.shellPath);
    const meta = await getMetaFromPage(page);
    const manifest = buildManifestFromMeta(meta) ?? {
      fps: meta.fps,
      duration: meta.duration,
      captions: meta.captions,
    };

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`Wrote audio manifest to ${outPath}`);
    await disposeRenderShell(page);
  } finally {
    await browser.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function runValidate(args: Map<string, string | boolean>): void {
  const manifestPath = requireString(args, "manifest");
  const loaded = loadAudioManifest(manifestPath);
  const issues = validateAudioManifest(loaded.manifest, {
    baseDir: loaded.baseDir,
  });

  if (issues.length === 0) {
    console.log(`Manifest is valid: ${loaded.path}`);
    return;
  }

  for (const issue of issues) {
    const prefix = issue.severity === "error" ? "ERROR" : "WARN ";
    console.log(`[${prefix}] ${issue.message}`);
  }

  if (issues.some((issue) => issue.severity === "error")) {
    process.exit(1);
  }
}

function printSoundIssues(
  issues: Array<{
    severity: "error" | "warning";
    path: string;
    message: string;
  }>,
): void {
  for (const issue of issues) {
    const prefix = issue.severity === "error" ? "ERROR" : "WARN ";
    console.log(`[${prefix}] ${issue.path}: ${issue.message}`);
  }
}

function runValidateSfx(args: Map<string, string | boolean>): void {
  const registry = loadLocalSoundAssetRegistry(requireString(args, "registry"));
  const issues = validateLocalSoundAssetRegistry(
    registry.registry,
    registry.baseDir,
  );
  if (typeof args.get("manifest") === "string") {
    const loaded = loadAudioManifest(String(args.get("manifest")));
    issues.push(
      ...validateSoundCueCoverage(loaded.manifest, registry.registry),
    );
    issues.push(
      ...validateAudioManifest(loaded.manifest, { baseDir: loaded.baseDir }),
    );
  }
  if (issues.length === 0) {
    console.log(`Local sound registry is valid: ${registry.path}`);
    return;
  }
  printSoundIssues(issues);
  if (issues.some((issue) => issue.severity === "error")) process.exit(1);
}

function runResolveSfx(args: Map<string, string | boolean>): void {
  const manifestPath = requireString(args, "manifest");
  const registryPath = requireString(args, "registry");
  const loaded = loadAudioManifest(manifestPath);
  const outManifestPath = path.resolve(
    String(args.get("outManifest") ?? `${manifestPath}.sfx.resolved.json`),
  );
  const resolved = resolveLocalSoundCues(loaded.manifest, registryPath, {
    outputManifestPath: outManifestPath,
    sourceManifestBaseDir: loaded.baseDir,
  });
  const resolvedManifest: CompositionAudioManifest = {
    ...loaded.manifest,
    tracks: resolved.tracks,
  };
  fs.mkdirSync(path.dirname(outManifestPath), { recursive: true });
  fs.writeFileSync(
    outManifestPath,
    `${JSON.stringify(resolvedManifest, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Resolved ${resolved.cues.length} local SFX cue(s) to ${outManifestPath}`,
  );
}

function runPlanSfx(args: Map<string, string | boolean>): void {
  const loaded = loadAudioManifest(requireString(args, "manifest"));
  const outPath = path.resolve(requireString(args, "out"));
  const entries = planSoundDesign(loaded.manifest, {
    includeDefaults: args.get("authoredOnly") !== true,
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, formatSoundDesignMarkdown(entries), "utf8");
  const authored = entries.filter(
    (entry) => entry.source === "authored",
  ).length;
  console.log(
    `Wrote ${entries.length} sound cue(s) (${authored} authored, ${entries.length - authored} suggested) to ${outPath}`,
  );
}

async function synthesizeOpenAiTts(
  text: string,
  outPath: string,
  options: {
    apiKey: string;
    baseUrl: string;
    model: string;
    voice: string;
  },
): Promise<void> {
  const response = await fetch(
    `${options.baseUrl.replace(/\/$/, "")}/audio/speech`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model,
        voice: options.voice,
        input: text,
        format: "mp3",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `OpenAI TTS failed: ${response.status} ${response.statusText}`,
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, bytes);
}

async function synthesizeElevenLabsTts(
  text: string,
  outPath: string,
  options: {
    apiKey: string;
    baseUrl: string;
    model: string;
    voice: string;
    outputFormat: string;
  },
): Promise<void> {
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  const url = `${baseUrl}/text-to-speech/${encodeURIComponent(options.voice)}?output_format=${encodeURIComponent(options.outputFormat)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": options.apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: options.model,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `ElevenLabs TTS failed: ${response.status} ${response.statusText}`,
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, bytes);
}

async function synthesizeMiniMaxTts(
  text: string,
  outPath: string,
  options: { voice?: string },
): Promise<void> {
  const args = ["speech", "synthesize", "--text", text, "--out", outPath];
  if (options.voice) {
    args.push("--voice", options.voice);
  }
  await execFileAsync("mmx", args);
}

async function synthesizeEdgeTts(
  text: string,
  outPath: string,
  options: { voice: string },
): Promise<void> {
  const args = [
    "--text",
    text,
    "--voice",
    options.voice,
    "--write-media",
    outPath,
  ];
  const bin = resolveEdgeTtsExecutable();
  if (bin === "python-module") {
    await execFileAsync(process.env.PYTHON ?? "python", [
      "-m",
      "edge_tts",
      ...args,
    ]);
    return;
  }
  await execFileAsync(bin, args, {
    // Windows .cmd/.bat wrappers require a shell; bare exes do not.
    shell: process.platform === "win32" && /\.(cmd|bat)$/i.test(bin),
  });
}

async function probeMediaDurationMs(filePath: string): Promise<number> {
  try {
    await execFileAsync("ffmpeg", ["-i", filePath]);
  } catch (error) {
    const stderr =
      error && typeof error === "object" && "stderr" in error
        ? String((error as { stderr?: string }).stderr ?? "")
        : "";
    const match = stderr.match(/Duration:\s+(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (!match) {
      throw new Error(`Unable to probe duration for ${filePath}`);
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
  }

  throw new Error(`Unable to probe duration for ${filePath}`);
}

function resolveEdgeTtsExecutable(): string {
  const explicit = process.env.EDGE_TTS_BIN;
  if (explicit) {
    return explicit;
  }

  const candidate = path.join(WINDOWS_USER_SCRIPT_DIR, "edge-tts.exe");
  if (candidate && fs.existsSync(candidate)) {
    return candidate;
  }

  // Prefer `python -m edge_tts` when the console script is not on PATH.
  return "python-module";
}

function resolveProvider(providerValue: string): TtsProvider {
  switch (providerValue) {
    case "elevenlabs":
    case "minimax":
    case "edge-tts":
    case "openai":
      return providerValue;
    default:
      throw new Error(
        `Unsupported provider "${providerValue}". Use one of: elevenlabs, minimax, edge-tts, openai.`,
      );
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hasExplicitCueTiming(
  cue: NarrationCue | undefined,
): cue is NarrationCue {
  return Boolean(
    cue &&
    (cue.startMs !== undefined ||
      cue.endMs !== undefined ||
      cue.startFrame !== undefined ||
      cue.endFrame !== undefined),
  );
}

function getAuthoredCaptionWindow(
  manifest: CompositionAudioManifest,
  caption: CaptionCue,
  fps: number,
  fallbackIndex: number,
): { startMs: number; endMs: number } | undefined {
  if (caption.sceneId) {
    const sceneCaptions = (manifest.captions ?? []).filter(
      (item) => item.sceneId === caption.sceneId,
    );
    if (sceneCaptions.length > 0) {
      return {
        startMs: Math.min(...sceneCaptions.map((item) => item.startMs)),
        endMs: Math.max(...sceneCaptions.map((item) => item.endMs)),
      };
    }

    const sceneCue = (manifest.narration ?? []).find(
      (item) => item.sceneId === caption.sceneId,
    );
    if (hasExplicitCueTiming(sceneCue)) {
      return resolveNarrationCueTimes(sceneCue, fps);
    }
  }

  const indexedCue = manifest.narration?.[fallbackIndex];
  if (hasExplicitCueTiming(indexedCue)) {
    return resolveNarrationCueTimes(indexedCue, fps);
  }

  return undefined;
}

async function ensureProviderReady(provider: TtsProvider): Promise<void> {
  switch (provider) {
    case "elevenlabs":
      if (!process.env.ELEVENLABS_API_KEY) {
        throw new Error(
          'ELEVENLABS_API_KEY is required for provider "elevenlabs".',
        );
      }
      return;
    case "minimax":
      await execFileAsync("mmx", ["auth", "status"]).catch(() => {
        throw new Error(
          "MiniMax provider requires the `mmx` CLI and an authenticated session. Run `npm install -g mmx-cli` and `mmx auth login --api-key ...`.",
        );
      });
      return;
    case "edge-tts": {
      const bin = resolveEdgeTtsExecutable();
      const help =
        bin === "python-module"
          ? execFileAsync(process.env.PYTHON ?? "python", [
              "-m",
              "edge_tts",
              "--help",
            ])
          : execFileAsync(bin, ["--help"], {
              shell: process.platform === "win32" && /\.(cmd|bat)$/i.test(bin),
            });
      await help.catch(() => {
        throw new Error(
          "edge-tts provider requires the `edge-tts` CLI. Install it with `python -m pip install --user edge-tts`, add the user Scripts directory to PATH, or set EDGE_TTS_BIN explicitly.",
        );
      });
      return;
    }
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for provider "openai".');
      }
      return;
  }
}

async function runSynthesize(
  args: Map<string, string | boolean>,
): Promise<void> {
  const manifestPath = requireString(args, "manifest");
  const outDir = path.resolve(requireString(args, "outDir"));
  const provider = resolveProvider(
    String(
      args.get("provider") ?? process.env.SEQVIO_TTS_PROVIDER ?? "elevenlabs",
    ),
  );
  const voice = String(
    args.get("voice") ??
      (provider === "elevenlabs"
        ? (process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb")
        : provider === "minimax"
          ? (process.env.MINIMAX_TTS_VOICE ?? "")
          : provider === "edge-tts"
            ? (process.env.EDGE_TTS_VOICE ?? "zh-CN-YunxiNeural")
            : (process.env.OPENAI_TTS_VOICE ?? "alloy")),
  );
  const model = String(
    args.get("model") ??
      (provider === "elevenlabs"
        ? (process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2")
        : (process.env.OPENAI_TTS_MODEL ?? "tts-1")),
  );
  const baseUrl = String(
    args.get("baseUrl") ??
      (provider === "elevenlabs"
        ? (process.env.ELEVENLABS_BASE_URL ?? "https://api.elevenlabs.io/v1")
        : (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1")),
  );
  const loaded = loadAudioManifest(manifestPath);
  const manifest = loaded.manifest;
  const fps = Math.max(1, manifest.fps ?? 30);
  const outManifestPath = path.resolve(
    String(
      args.get("outManifest") ??
        path.join(outDir, "audio-manifest.resolved.json"),
    ),
  );
  const elevenLabsOutputFormat =
    process.env.ELEVENLABS_OUTPUT_FORMAT ?? "mp3_44100_128";

  await ensureProviderReady(provider);

  const generatedTracks = [];
  const synthesizedNarration: NarrationCue[] = [];
  let counter = 0;
  fs.mkdirSync(path.join(outDir, "narration"), { recursive: true });
  let sequentialOffsetMs = 0;
  for (const cue of manifest.narration ?? []) {
    if (cue.silent || cue.text.trim() === "") {
      continue;
    }

    counter += 1;
    const fileName = `${String(counter).padStart(3, "0")}-${cue.id}.mp3`;
    const outPath = path.join(outDir, "narration", fileName);
    const effectiveVoice = cue.voice ?? voice;

    switch (provider) {
      case "elevenlabs":
        await synthesizeElevenLabsTts(cue.text, outPath, {
          apiKey: process.env.ELEVENLABS_API_KEY!,
          baseUrl,
          model,
          voice: effectiveVoice,
          outputFormat: elevenLabsOutputFormat,
        });
        break;
      case "minimax":
        await synthesizeMiniMaxTts(cue.text, outPath, {
          voice: effectiveVoice || undefined,
        });
        break;
      case "edge-tts":
        await synthesizeEdgeTts(cue.text, outPath, {
          voice: effectiveVoice,
        });
        break;
      case "openai":
        await synthesizeOpenAiTts(cue.text, outPath, {
          apiKey: process.env.OPENAI_API_KEY!,
          baseUrl,
          model,
          voice: effectiveVoice,
        });
        break;
    }

    const probedDurationMs = await probeMediaDurationMs(outPath);
    const { startMs, endMs } = resolveSynthesizedCueTiming(
      cue,
      fps,
      probedDurationMs,
      sequentialOffsetMs,
    );
    sequentialOffsetMs = Math.max(sequentialOffsetMs, endMs);

    const resolvedCue: NarrationCue = {
      ...cue,
      startMs,
      endMs,
      startFrame: msToFrames(startMs, fps),
      endFrame: msToFrames(endMs, fps),
    };
    synthesizedNarration.push(resolvedCue);

    generatedTracks.push({
      id: cue.id,
      src: path.relative(path.dirname(outManifestPath), outPath),
      kind: "narration" as const,
      volume: 1,
      offsetMs: startMs,
    });
    console.log(`Synthesized ${cue.id} with ${provider} -> ${outPath}`);
  }

  const reflowedTimeline = reflowSynthesizedTimeline(
    manifest,
    synthesizedNarration,
    fps,
  );
  const resolvedNarration = reflowedTimeline.narration;
  const resolvedTracks = generatedTracks.map((track) => ({
    ...track,
    offsetMs:
      resolvedNarration.find((cue) => cue.id === track.id)?.startMs ??
      track.offsetMs,
  }));

  const resolvedCaptions: CaptionCue[] =
    (manifest.captions?.length ?? 0) > 0
      ? manifest.captions!.map((caption, index) => {
          const matchedCue =
            (caption.sceneId
              ? resolvedNarration.find((cue) => cue.sceneId === caption.sceneId)
              : undefined) ?? resolvedNarration[index];

          if (!matchedCue) {
            return caption;
          }

          const authoredWindow = getAuthoredCaptionWindow(
            manifest,
            caption,
            fps,
            index,
          );
          if (authoredWindow) {
            const authoredDuration = Math.max(
              1,
              authoredWindow.endMs - authoredWindow.startMs,
            );
            const resolvedStartMs = matchedCue.startMs ?? caption.startMs;
            const resolvedEndMs = matchedCue.endMs ?? caption.endMs;
            const resolvedDuration = Math.max(
              1,
              resolvedEndMs - resolvedStartMs,
            );
            const startRatio = clamp(
              (caption.startMs - authoredWindow.startMs) / authoredDuration,
              0,
              1,
            );
            const endRatio = clamp(
              (caption.endMs - authoredWindow.startMs) / authoredDuration,
              startRatio,
              1,
            );

            return {
              ...caption,
              sceneId: caption.sceneId ?? matchedCue.sceneId,
              startMs: Math.round(
                resolvedStartMs + startRatio * resolvedDuration,
              ),
              endMs: Math.round(resolvedStartMs + endRatio * resolvedDuration),
            };
          }

          return {
            ...caption,
            sceneId: caption.sceneId ?? matchedCue.sceneId,
            startMs: matchedCue.startMs ?? caption.startMs,
            endMs: matchedCue.endMs ?? caption.endMs,
          };
        })
      : resolvedNarration.map((cue) => ({
          sceneId: cue.sceneId,
          text: cue.text,
          startMs: cue.startMs ?? 0,
          endMs: cue.endMs ?? cue.startMs ?? 0,
        }));

  const resolvedManifest: CompositionAudioManifest = {
    ...manifest,
    lockToAudio: manifest.lockToAudio ?? true,
    narration: resolvedNarration,
    tracks: [...(manifest.tracks ?? []), ...resolvedTracks],
    captions: resolvedCaptions,
    sceneTimings: reflowedTimeline.sceneTimings,
    explanationBeats: reflowedTimeline.explanationBeats,
    duration:
      reflowedTimeline.durationFrames ??
      (resolvedNarration.length > 0
        ? msToFrames(
            Math.max(...resolvedNarration.map((cue) => cue.endMs ?? 0)),
            fps,
          )
        : manifest.duration),
  };

  fs.mkdirSync(path.dirname(outManifestPath), { recursive: true });
  fs.writeFileSync(
    outManifestPath,
    `${JSON.stringify(resolvedManifest, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote resolved manifest to ${outManifestPath}`);
}

async function main(): Promise<void> {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (!command || args.get("help")) {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  switch (command) {
    case "extract":
      await runExtract(args);
      break;
    case "validate":
      runValidate(args);
      break;
    case "synthesize":
      await runSynthesize(args);
      break;
    case "plan-sfx":
      runPlanSfx(args);
      break;
    case "resolve-sfx":
      runResolveSfx(args);
      break;
    case "validate-sfx":
      runValidateSfx(args);
      break;
    default:
      printUsage();
      process.exit(1);
  }
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`seqvio-audio failed: ${message}`);
  process.exit(1);
});
