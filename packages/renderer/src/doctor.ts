import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';

import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import puppeteer from 'puppeteer';

const execFileAsync = promisify(execFile);

export type DoctorStatus = 'pass' | 'warn' | 'fail';

export interface DoctorCheck {
  code: string;
  label: string;
  status: DoctorStatus;
  detail: string;
  repair?: string;
}

export interface DoctorReport {
  schemaVersion: 1;
  ok: boolean;
  generatedAt: string;
  environment: {
    platform: NodeJS.Platform;
    release: string;
    arch: string;
    node: string;
    cwd: string;
  };
  checks: DoctorCheck[];
}

export interface DoctorOptions {
  cwd?: string;
  launchBrowser?: boolean;
}

export function resolveManimPythonCommand(cwd: string, configured?: string): string {
  if (configured) return configured;
  const local = process.platform === 'win32'
    ? path.join(cwd, '.venv-manim', 'Scripts', 'python.exe')
    : path.join(cwd, '.venv-manim', 'bin', 'python');
  return fs.existsSync(local) ? local : 'python';
}

export function supportsNodeVersion(version: string): boolean {
  const match = /^v?(\d+)/.exec(version.trim());
  return match !== null && Number(match[1]) >= 18;
}

export function doctorExitCode(report: DoctorReport): number {
  return report.ok ? 0 : 1;
}

function check(code: string, label: string, status: DoctorStatus, detail: string, repair?: string): DoctorCheck {
  return { code, label, status, detail, ...(repair ? { repair } : {}) };
}

function projectRequire(cwd: string): NodeRequire {
  const anchor = path.join(cwd, 'package.json');
  return createRequire(fs.existsSync(anchor) ? anchor : __filename);
}

async function checkWritableDirectory(cwd: string, directory: string): Promise<DoctorCheck> {
  const target = path.join(cwd, directory);
  const probe = path.join(target, `.seqvio-doctor-${process.pid}-${Date.now()}`);
  try {
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(probe, 'ok', 'utf8');
    fs.unlinkSync(probe);
    return check(`writable_${directory}`, `${directory}/ writable`, 'pass', target);
  } catch (error) {
    return check(
      `writable_${directory}`,
      `${directory}/ writable`,
      'fail',
      error instanceof Error ? error.message : String(error),
      `Grant write access to ${target} or run Seqvio from a writable project directory.`,
    );
  }
}

async function checkFfmpeg(): Promise<DoctorCheck> {
  try {
    const { stderr } = await execFileAsync(ffmpegInstaller.path, [
      '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
      'color=c=black:s=16x16:d=0.04', '-frames:v', '1', '-f', 'null', '-',
    ], { windowsHide: true, timeout: 15_000, maxBuffer: 2 * 1024 * 1024 });
    if (stderr.trim()) {
      return check('ffmpeg_probe', 'FFmpeg media probe', 'warn', stderr.trim());
    }
    return check('ffmpeg_probe', 'FFmpeg media probe', 'pass', ffmpegInstaller.path);
  } catch (error) {
    return check(
      'ffmpeg_probe', 'FFmpeg media probe', 'fail',
      error instanceof Error ? error.message : String(error),
      'Reinstall dependencies so @ffmpeg-installer/ffmpeg provides a runnable binary.',
    );
  }
}

async function checkChromium(launchBrowser: boolean): Promise<DoctorCheck> {
  const executable = puppeteer.executablePath();
  if (!fs.existsSync(executable)) {
    return check(
      'chromium', 'Chromium', 'fail', `Executable not found: ${executable}`,
      'Reinstall Puppeteer or configure its browser download/cache for this host.',
    );
  }
  if (!launchBrowser) {
    return check('chromium', 'Chromium', 'warn', `Executable exists but launch was skipped: ${executable}`);
  }
  try {
    const browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 30_000,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent('<!doctype html><title>seqvio-doctor</title><p>ready</p>');
      const ready = await page.$eval('p', (element) => element.textContent);
      return check('chromium', 'Chromium', ready === 'ready' ? 'pass' : 'fail', await browser.version());
    } finally {
      await browser.close();
    }
  } catch (error) {
    return check(
      'chromium', 'Chromium', 'fail', error instanceof Error ? error.message : String(error),
      'Install missing Chromium system libraries or permit headless browser execution.',
    );
  }
}

function checkNodePty(requireFromProject: NodeRequire): DoctorCheck {
  try {
    const resolved = requireFromProject.resolve('node-pty');
    const module = requireFromProject('node-pty') as { spawn?: unknown };
    if (typeof module.spawn !== 'function') throw new Error('node-pty does not export spawn().');
    return check('node_pty', 'node-pty native module', 'pass', resolved);
  } catch (error) {
    return check(
      'node_pty', 'node-pty native module', 'fail', error instanceof Error ? error.message : String(error),
      'Run npm ci on a supported Node version and rebuild node-pty for this operating system.',
    );
  }
}

function checkFontAssets(requireFromProject: NodeRequire): DoctorCheck {
  const assets = [
    ['JetBrains Mono', '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'],
    ['Cascadia Mono Latin', '@fontsource/cascadia-mono/files/cascadia-mono-latin-400-normal.woff2'],
    ['Cascadia Mono Symbols', '@fontsource/cascadia-mono/files/cascadia-mono-symbols2-400-normal.woff2'],
  ];
  const missing: string[] = [];
  for (const [label, request] of assets) {
    try {
      requireFromProject.resolve(request);
    } catch {
      missing.push(label);
    }
  }
  if (missing.length === 0) {
    return check('font_assets', 'Bundled technical fonts', 'pass', assets.map(([label]) => label).join(', '));
  }
  return check(
    'font_assets', 'Bundled technical fonts', 'fail', `Missing: ${missing.join(', ')}`,
    'Run npm ci and verify @seqvio/technical font dependencies are installed.',
  );
}

function checkManim(requireFromProject: NodeRequire, cwd: string): DoctorCheck {
  try {
    let resolved: string;
    try {
      resolved = requireFromProject.resolve('@seqvio/manim-adapter');
    } catch {
      const workspaceEntry = path.join(cwd, 'packages', 'manim-adapter', 'dist', 'index.js');
      if (!fs.existsSync(workspaceEntry)) throw new Error('Cannot resolve @seqvio/manim-adapter or its workspace build.');
      resolved = workspaceEntry;
    }
    const adapter = requireFromProject(resolved) as {
      preflightManim?: (pythonCommand?: string) => { available: boolean; pythonVersion?: string; manimVersion?: string; diagnostics: string[] };
    };
    if (typeof adapter.preflightManim !== 'function') throw new Error('Adapter does not export preflightManim().');
    const pythonCommand = resolveManimPythonCommand(cwd, process.env.SEQVIO_MANIM_PYTHON);
    const result = adapter.preflightManim(pythonCommand);
    if (result.available) return check('manim', 'Manim adapter', 'pass', `${result.pythonVersion}; ${result.manimVersion}; ${resolved}`);
    return check('manim', 'Manim adapter', 'warn', result.diagnostics.join(', ') || `Unavailable through ${pythonCommand}`, 'Install Manim in .venv-manim or set SEQVIO_MANIM_PYTHON to its Python executable.');
  } catch (error) {
    return check('manim', 'Manim adapter', 'warn', error instanceof Error ? error.message : String(error), 'Install @seqvio/manim-adapter only when mathematical animation is required.');
  }
}

export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const checks: DoctorCheck[] = [];
  checks.push(supportsNodeVersion(process.version)
    ? check('node_version', 'Node.js version', 'pass', process.version)
    : check('node_version', 'Node.js version', 'fail', process.version, 'Install Node.js 18 or newer.'));

  const requireFromProject = projectRequire(cwd);
  checks.push(checkNodePty(requireFromProject));
  checks.push(checkFontAssets(requireFromProject));
  checks.push(checkManim(requireFromProject, cwd));
  checks.push(await checkFfmpeg());
  checks.push(await checkChromium(options.launchBrowser !== false));
  checks.push(await checkWritableDirectory(cwd, 'temp'));
  checks.push(await checkWritableDirectory(cwd, 'output'));

  return {
    schemaVersion: 1,
    ok: checks.every((entry) => entry.status !== 'fail'),
    generatedAt: new Date().toISOString(),
    environment: {
      platform: process.platform,
      release: os.release(),
      arch: process.arch,
      node: process.version,
      cwd,
    },
    checks,
  };
}
