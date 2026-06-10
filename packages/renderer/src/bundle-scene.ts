/**
 * esbuild bundler for user scene TSX → browser bundle
 */

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import type { CaptionCue, CompositionAudioManifest } from './media-contract';
import {
  collectNodeModulesRoots,
  getRendererPackageRoot,
  resolvePackageFile,
  resolvePackageModuleEntry,
} from './resolve-package';

export interface BundleSceneOptions {
  componentPath: string;
  outDir: string;
  width: number;
  height: number;
  fps?: number;
  duration?: number;
  burnCaptions?: boolean;
  captions?: CaptionCue[];
  resolvedAudioManifest?: CompositionAudioManifest;
}

export interface BundleSceneResult {
  bundlePath: string;
  shellPath: string;
  outDir: string;
}

function toImportPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

export function resolveComponentPath(componentPath: string): string {
  const candidates = [
    componentPath,
    path.resolve(process.cwd(), componentPath),
    path.resolve(getRendererPackageRoot(), componentPath),
    path.resolve(getRendererPackageRoot(), '..', '..', componentPath),
  ];

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (fs.existsSync(normalized)) return path.resolve(normalized);
    if (fs.existsSync(`${normalized}.tsx`)) return path.resolve(`${normalized}.tsx`);
    if (fs.existsSync(`${normalized}.ts`)) return path.resolve(`${normalized}.ts`);
    if (fs.existsSync(path.join(normalized, 'index.tsx'))) {
      return path.resolve(path.join(normalized, 'index.tsx'));
    }
    if (fs.existsSync(path.join(normalized, 'index.ts'))) {
      return path.resolve(path.join(normalized, 'index.ts'));
    }
  }

  throw new Error(`Component file not found: ${componentPath}`);
}

function writeRenderShell(outDir: string, width: number, height: number): string {
  const shellPath = path.join(outDir, 'render-shell.html');
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: white;
    }
    #root {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      position: relative;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="./scene-bundle.js"></script>
</body>
</html>`;
  fs.writeFileSync(shellPath, html, 'utf8');
  return shellPath;
}

function writeGeneratedEntry(
  outDir: string,
  scenePath: string,
  runtimePath: string,
  options: BundleSceneOptions
): string {
  const entryPath = path.join(outDir, 'generated-entry.tsx');
  const sceneImport = toImportPath(scenePath);
  const runtimeImport = toImportPath(runtimePath);

  const entrySource = `import Scene, { meta as sceneMeta } from '${sceneImport}';
import { mountBrowserRuntime } from '${runtimeImport}';

mountBrowserRuntime(Scene, sceneMeta, {
  width: ${options.width},
  height: ${options.height},
  defaultFps: ${options.fps ?? 30},
  defaultDuration: ${options.duration ?? 300},
  burnCaptions: ${options.burnCaptions ? 'true' : 'false'},
  captions: ${JSON.stringify(options.captions ?? null)},
  resolvedAudioManifest: ${JSON.stringify(options.resolvedAudioManifest ?? null)},
});
`;

  fs.writeFileSync(entryPath, entrySource, 'utf8');
  return entryPath;
}

function findFirstExisting(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function copyBundledAssets(outDir: string): void {
  const roots = collectNodeModulesRoots();

  const dejavuCandidates: string[] = [];
  const notoCandidates: string[] = [];

  for (const root of roots) {
    dejavuCandidates.push(
      path.join(root, 'dejavu-fonts-ttf', 'ttf', 'DejaVuSans.ttf')
    );
    notoCandidates.push(
      path.join(
        root,
        '@fontsource',
        'noto-sans-sc',
        'files',
        'noto-sans-sc-chinese-simplified-400-normal.woff'
      )
    );
  }

  const dejavu = findFirstExisting(dejavuCandidates);
  if (dejavu) {
    fs.copyFileSync(dejavu, path.join(outDir, 'DejaVuSans.ttf'));
  }

  const noto = findFirstExisting(notoCandidates);
  if (noto) {
    fs.copyFileSync(noto, path.join(outDir, 'NotoSansSC-Regular.woff'));
  }

  const virgilBundled = resolvePackageFile(
    '@seqvio/whiteboard',
    'assets',
    'fonts',
    'Virgil.woff2'
  );
  if (fs.existsSync(virgilBundled)) {
    fs.copyFileSync(virgilBundled, path.join(outDir, 'Virgil.woff2'));
  }

  const longCangBundled = resolvePackageFile(
    '@seqvio/whiteboard',
    'assets',
    'fonts',
    'LongCang-Regular.ttf'
  );
  if (fs.existsSync(longCangBundled)) {
    fs.copyFileSync(longCangBundled, path.join(outDir, 'LongCang-Regular.ttf'));
  }
}

export async function bundleScene(options: BundleSceneOptions): Promise<BundleSceneResult> {
  const resolvedScene = resolveComponentPath(options.componentPath);
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  copyBundledAssets(outDir);

  const runtimePath = path.resolve(getRendererPackageRoot(), 'src', 'browser', 'runtime.tsx');
  const entryPath = writeGeneratedEntry(outDir, resolvedScene, runtimePath, options);
  const bundlePath = path.join(outDir, 'scene-bundle.js');
  const shellPath = writeRenderShell(outDir, options.width, options.height);

  const whiteboardEntry = resolvePackageModuleEntry('@seqvio/whiteboard');
  const coreEntry = resolvePackageModuleEntry('@seqvio/core');

  const alias: Record<string, string> = {
    '@seqvio/whiteboard': whiteboardEntry,
    '@seqvio/core': coreEntry,
  };
  // Presentation is an optional style package; alias it when installed so
  // presentation-style compositions bundle, without making it a hard dependency.
  try {
    alias['@seqvio/presentation'] = resolvePackageModuleEntry('@seqvio/presentation');
  } catch {
    // Not installed — whiteboard compositions still bundle fine.
  }

  try {
    await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      outfile: bundlePath,
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
      jsx: 'automatic',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.woff': 'file',
        '.woff2': 'file',
        '.ttf': 'file',
        '.otf': 'file',
      },
      alias,
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      logLevel: 'warning',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to bundle scene "${resolvedScene}": ${message}`);
  }

  return { bundlePath, shellPath, outDir };
}
