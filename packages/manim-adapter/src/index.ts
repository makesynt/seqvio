import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MANIM_SCENE_FORMAT = 'seqvio-manim-scene' as const;
export const MANIM_SCENE_VERSION = '1.0' as const;

export interface ManimSceneSpec {
  format: typeof MANIM_SCENE_FORMAT;
  version: typeof MANIM_SCENE_VERSION;
  id: string;
  pythonFile: string;
  className: string;
  width?: number;
  height?: number;
  fps?: number;
  quality?: 'low' | 'medium' | 'high';
  args?: string[];
}

export interface ManimRenderManifest {
  scene: ManimSceneSpec;
  command: string[];
  outputPath?: string;
  status: 'planned' | 'rendered' | 'failed';
  manimVersion?: string;
  pythonVersion?: string;
  capabilities: string[];
  diagnostics: string[];
  cacheKey?: string;
  cached?: boolean;
  durationSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  alphaMode?: 'opaque' | 'straight' | 'premultiplied';
  markers?: Array<{ id: string; frame: number }>;
  logPath?: string;
}

export interface ManimPreflightResult {
  available: boolean;
  python?: string;
  manim?: string;
  pythonVersion?: string;
  manimVersion?: string;
  capabilities: string[];
  diagnostics: string[];
}

export interface ManimMediaProbe {
  width?: number;
  height?: number;
  fps?: number;
  durationSeconds?: number;
  codec?: string;
  alphaMode?: 'opaque' | 'straight' | 'premultiplied';
}

function probe(command: string, args: string[]): string | undefined {
  try { return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return undefined; }
}

export function probeManimMedia(mediaPath: string, ffprobeCommand = 'ffprobe'): ManimMediaProbe | undefined {
  try {
    const raw = execFileSync(ffprobeCommand, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,codec_name,pix_fmt:format=duration', '-of', 'json', mediaPath], { encoding: 'utf8' });
    const parsed = JSON.parse(raw) as { streams?: Array<{ width?: number; height?: number; r_frame_rate?: string; codec_name?: string; pix_fmt?: string }>; format?: { duration?: string } };
    const stream = parsed.streams?.[0];
    if (!stream) return undefined;
    const [num, den] = String(stream.r_frame_rate ?? '').split('/').map(Number);
    const pix = stream.pix_fmt ?? '';
    return { width: stream.width, height: stream.height, fps: den ? num / den : undefined, durationSeconds: parsed.format?.duration ? Number(parsed.format.duration) : undefined, codec: stream.codec_name, alphaMode: pix.includes('a') ? 'straight' : 'opaque' };
  } catch { return undefined; }
}

export function validateManimScene(scene: unknown): string[] {
  const errors: string[] = [];
  if (!scene || typeof scene !== 'object') return ['scene must be an object'];
  const value = scene as Partial<ManimSceneSpec>;
  if (value.format !== MANIM_SCENE_FORMAT) errors.push(`format must be "${MANIM_SCENE_FORMAT}"`);
  if (value.version !== MANIM_SCENE_VERSION) errors.push(`version must be "${MANIM_SCENE_VERSION}"`);
  if (!value.id) errors.push('id is required');
  if (!value.pythonFile) errors.push('pythonFile is required');
  if (!value.className) errors.push('className is required');
  return errors;
}

export function buildManimCommand(scene: ManimSceneSpec): string[] {
  return ['-m', 'manim', ...(scene.quality ? [`-${scene.quality === 'low' ? 'ql' : scene.quality === 'high' ? 'qh' : 'qm'}`] : []), ...(scene.fps ? ['--fps', String(scene.fps)] : []), scene.pythonFile, scene.className, ...(scene.args ?? [])];
}

export function preflightManim(pythonCommand = 'python'): ManimPreflightResult {
  const python = probe(pythonCommand, ['--version']);
  const manim = probe(pythonCommand, ['-m', 'manim', '--version']);
  const diagnostics: string[] = [];
  if (!python) diagnostics.push('python_not_found');
  if (!manim) diagnostics.push('manim_not_found');
  return { available: Boolean(python && manim), python: python ? 'python' : undefined, manim: manim ? 'python -m manim' : undefined, pythonVersion: python, manimVersion: manim, capabilities: manim ? ['scene-render', 'png-frame', 'mp4-export'] : [], diagnostics };
}

export function createManimManifest(scene: ManimSceneSpec, preflight = preflightManim()): ManimRenderManifest {
  const errors = validateManimScene(scene);
  return { scene, command: ['python', ...buildManimCommand(scene)], status: errors.length || !preflight.available ? 'failed' : 'planned', manimVersion: preflight.manimVersion, pythonVersion: preflight.pythonVersion, capabilities: preflight.capabilities, diagnostics: [...errors, ...preflight.diagnostics] };
}

export interface ManimExecutionOptions {
  cwd?: string;
  cacheDir?: string;
  expectedOutputPath?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  pythonCommand?: string;
  preflight?: ManimPreflightResult;
  dryRun?: boolean;
  onProgress?: (event: { phase: 'planned' | 'rendering' | 'cached' | 'complete'; progress?: number; message?: string }) => void;
}

export async function hashManimRender(scene: ManimSceneSpec, preflight: ManimPreflightResult): Promise<string> {
  let source = '';
  try { source = await readFile(scene.pythonFile, 'utf8'); } catch { source = `missing:${scene.pythonFile}`; }
  return createHash('sha256').update(JSON.stringify({ scene, source, python: preflight.pythonVersion, manim: preflight.manimVersion })).digest('hex');
}

export async function executeManimScene(scene: ManimSceneSpec, options: ManimExecutionOptions = {}): Promise<ManimRenderManifest> {
  const pythonCommand = options.pythonCommand ?? 'python';
  const preflight = options.preflight ?? preflightManim(pythonCommand);
  const manifest = createManimManifest(scene, preflight);
  const errors = validateManimScene(scene);
  if (errors.length) return manifest;
  const cacheKey = await hashManimRender(scene, preflight);
  manifest.cacheKey = cacheKey;
  const cacheDir = path.resolve(options.cacheDir ?? '.seqvio-cache/manim');
  const cacheManifestPath = path.join(cacheDir, `${cacheKey}.json`);
  try {
    const cached = JSON.parse(await readFile(cacheManifestPath, 'utf8')) as ManimRenderManifest;
    if (cached.outputPath && (await stat(cached.outputPath)).isFile()) {
      options.onProgress?.({ phase: 'cached', progress: 1, message: cacheKey });
      return { ...cached, cached: true };
    }
  } catch { /* Cache miss. */ }

  const command = [pythonCommand, ...buildManimCommand(scene)];
  manifest.command = command;
  manifest.cached = false;
  if (options.dryRun) {
    manifest.status = 'planned';
    options.onProgress?.({ phase: 'planned', progress: 0, message: command.join(' ') });
    return manifest;
  }
  if (!preflight.available) return manifest;

  await mkdir(cacheDir, { recursive: true });
  const logPath = path.join(cacheDir, `${cacheKey}.log`);
  manifest.logPath = logPath;
  const logs: string[] = [];
  const timeoutMs = options.timeoutMs ?? 10 * 60_000;
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), { cwd: options.cwd, windowsHide: true });
    const finish = (error?: Error) => { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); error ? reject(error) : resolve(); };
    const abort = () => { child.kill(); finish(new Error('manim_cancelled')); };
    const timer = setTimeout(() => { child.kill(); finish(new Error('manim_timeout')); }, timeoutMs);
    options.signal?.addEventListener('abort', abort, { once: true });
    const capture = (chunk: Buffer) => {
      const text = chunk.toString(); logs.push(text);
      const match = text.match(/(\d{1,3})%/);
      options.onProgress?.({ phase: 'rendering', progress: match ? Math.min(1, Number(match[1]) / 100) : undefined, message: text.trim() });
    };
    child.stdout.on('data', capture); child.stderr.on('data', capture);
    child.on('error', finish);
    child.on('exit', (code) => code === 0 ? finish() : finish(new Error(`manim_exit_${code ?? 'unknown'}`)));
  }).catch((error) => { manifest.status = 'failed'; manifest.diagnostics.push(error instanceof Error ? error.message : String(error)); });
  await writeFile(logPath, logs.join(''), 'utf8');
  if (manifest.status !== 'failed') {
    manifest.status = 'rendered'; manifest.outputPath = options.expectedOutputPath;
    if (!manifest.outputPath || !probeManimMedia(manifest.outputPath)) {
      manifest.status = 'failed';
      manifest.diagnostics.push('missing_or_unreadable_media');
    } else {
      const media = probeManimMedia(manifest.outputPath);
      manifest.width = media?.width; manifest.height = media?.height; manifest.fps = media?.fps;
      manifest.durationSeconds = media?.durationSeconds; manifest.alphaMode = media?.alphaMode;
    }
  }
  if (manifest.status === 'rendered') {
    options.onProgress?.({ phase: 'complete', progress: 1 });
  }
  await writeFile(cacheManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}
