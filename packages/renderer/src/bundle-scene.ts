/**
 * esbuild bundler for user scene TSX → browser bundle
 */

import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import type { CaptionCue, CompositionAudioManifest } from "./media-contract";
import {
  collectNodeModulesRoots,
  getRendererPackageRoot,
  resolvePackageFile,
  resolvePackageModuleEntry,
} from "./resolve-package";

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
  whiteboardOptimize?: string;
}

export interface BundleSceneResult {
  bundlePath: string;
  shellPath: string;
  outDir: string;
}

function toImportPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function resolveComponentPath(componentPath: string): string {
  const candidates = [
    componentPath,
    path.resolve(process.cwd(), componentPath),
    path.resolve(getRendererPackageRoot(), componentPath),
    path.resolve(getRendererPackageRoot(), "..", "..", componentPath),
  ];

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (fs.existsSync(normalized)) return path.resolve(normalized);
    if (fs.existsSync(`${normalized}.tsx`))
      return path.resolve(`${normalized}.tsx`);
    if (fs.existsSync(`${normalized}.ts`))
      return path.resolve(`${normalized}.ts`);
    if (fs.existsSync(path.join(normalized, "index.tsx"))) {
      return path.resolve(path.join(normalized, "index.tsx"));
    }
    if (fs.existsSync(path.join(normalized, "index.ts"))) {
      return path.resolve(path.join(normalized, "index.ts"));
    }
  }

  throw new Error(`Component file not found: ${componentPath}`);
}

export function writeRenderShell(
  outDir: string,
  width: number,
  height: number,
): string {
  // Try to inline xterm.css if available (copied by copyBundledAssets).
  let xtermCss = "";
  const xtermCssPath = path.join(outDir, "xterm.css");
  if (fs.existsSync(xtermCssPath)) {
    xtermCss = fs.readFileSync(xtermCssPath, "utf-8");
  }

  const shellPath = path.join(outDir, "render-shell.html");
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${xtermCss}</style>
  <style>
    @font-face {
      font-family: 'JetBrains Mono';
      src: url('./JetBrainsMono-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: 'Cascadia Mono';
      src: url('./CascadiaMono-Latin-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: 'Cascadia Mono';
      src: url('./CascadiaMono-Symbols2-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: 'Inter';
      src: url('./Inter-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: 'Inter';
      src: url('./Inter-Medium.woff2') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: 'Inter';
      src: url('./Inter-Bold.woff2') format('woff2');
      font-weight: 700 900;
      font-style: normal;
      font-display: block;
    }
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
  <script src="./xterm.js"></script>
  <script src="./scene-bundle.js"></script>
</body>
</html>`;
  fs.writeFileSync(shellPath, html, "utf8");
  return shellPath;
}

function writeGeneratedEntry(
  outDir: string,
  scenePath: string,
  runtimePath: string,
  options: BundleSceneOptions,
): string {
  const entryPath = path.join(outDir, "generated-entry.tsx");
  const sceneImport = toImportPath(scenePath);
  const runtimeImport = toImportPath(runtimePath);

  const entrySource = `import Scene, { meta as sceneMeta } from '${sceneImport}';
import { mountBrowserRuntime } from '${runtimeImport}';

mountBrowserRuntime(Scene, sceneMeta, {
  width: ${options.width},
  height: ${options.height},
  defaultFps: ${options.fps ?? 30},
  defaultDuration: ${options.duration ?? 300},
  burnCaptions: ${options.burnCaptions ? "true" : "false"},
  captions: ${JSON.stringify(options.captions ?? null)},
  resolvedAudioManifest: ${JSON.stringify(options.resolvedAudioManifest ?? null)},
  whiteboardOptimize: ${JSON.stringify(options.whiteboardOptimize ?? "none")},
});
`;

  fs.writeFileSync(entryPath, entrySource, "utf8");
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
      path.join(root, "dejavu-fonts-ttf", "ttf", "DejaVuSans.ttf"),
    );
    notoCandidates.push(
      path.join(
        root,
        "@fontsource",
        "noto-sans-sc",
        "files",
        "noto-sans-sc-chinese-simplified-400-normal.woff",
      ),
    );
  }

  const dejavu = findFirstExisting(dejavuCandidates);
  if (dejavu) {
    fs.copyFileSync(dejavu, path.join(outDir, "DejaVuSans.ttf"));
  }

  const noto = findFirstExisting(notoCandidates);
  if (noto) {
    fs.copyFileSync(noto, path.join(outDir, "NotoSansSC-Regular.woff"));
  }

  const virgilBundled = resolvePackageFile(
    "@seqvio/whiteboard",
    "assets",
    "fonts",
    "Virgil.woff2",
  );
  if (fs.existsSync(virgilBundled)) {
    fs.copyFileSync(virgilBundled, path.join(outDir, "Virgil.woff2"));
  }

  const longCangBundled = resolvePackageFile(
    "@seqvio/whiteboard",
    "assets",
    "fonts",
    "LongCang-Regular.ttf",
  );
  if (fs.existsSync(longCangBundled)) {
    fs.copyFileSync(longCangBundled, path.join(outDir, "LongCang-Regular.ttf"));
  }

  for (const fontFile of [
    "Xiaolai-Regular.ttf",
    "LXGWWenKaiLite-Regular.ttf",
    "Yozai-Regular.ttf",
    "LiuJianMaoCao-Regular.ttf",
    "ZhiMangXing-Regular.ttf",
  ]) {
    const bundled = resolvePackageFile(
      "@seqvio/whiteboard",
      "assets",
      "fonts",
      fontFile,
    );
    if (fs.existsSync(bundled)) {
      fs.copyFileSync(bundled, path.join(outDir, fontFile));
    }
  }

  const jetbrainsCandidates: string[] = [];
  for (const root of roots) {
    jetbrainsCandidates.push(
      path.join(
        root,
        "@fontsource",
        "jetbrains-mono",
        "files",
        "jetbrains-mono-latin-400-normal.woff2",
      ),
    );
  }
  const jetbrains = findFirstExisting(jetbrainsCandidates);
  if (jetbrains) {
    fs.copyFileSync(
      jetbrains,
      path.join(outDir, "JetBrainsMono-Regular.woff2"),
    );
  }

  const cascadiaFiles = [
    [
      "cascadia-mono-latin-400-normal.woff2",
      "CascadiaMono-Latin-Regular.woff2",
    ],
    [
      "cascadia-mono-symbols2-400-normal.woff2",
      "CascadiaMono-Symbols2-Regular.woff2",
    ],
  ] as const;
  for (const [sourceName, outputName] of cascadiaFiles) {
    const candidates = roots.map((root) =>
      path.join(root, "@fontsource", "cascadia-mono", "files", sourceName),
    );
    const source = findFirstExisting(candidates);
    if (source) fs.copyFileSync(source, path.join(outDir, outputName));
  }

  const interFiles = [
    ["inter-latin-400-normal.woff2", "Inter-Regular.woff2"],
    ["inter-latin-500-normal.woff2", "Inter-Medium.woff2"],
    ["inter-latin-700-normal.woff2", "Inter-Bold.woff2"],
  ] as const;
  for (const [sourceName, outputName] of interFiles) {
    const candidates = roots.map((root) =>
      path.join(root, "@fontsource", "inter", "files", sourceName),
    );
    const source = findFirstExisting(candidates);
    if (source) fs.copyFileSync(source, path.join(outDir, outputName));
  }

  // xterm.js — copy the pre-built UMD bundle to the render temp dir.
  // Loaded via <script> in the shell so window.Terminal is ready before
  // the composition bundle mounts.
  const xtermJsCandidates = roots.map((root) =>
    path.join(root, "xterm", "lib", "xterm.js"),
  );
  const xtermJs = findFirstExisting(xtermJsCandidates);
  if (xtermJs) {
    fs.copyFileSync(xtermJs, path.join(outDir, "xterm.js"));
  }

  const xtermCssCandidates = roots.map((root) =>
    path.join(root, "xterm", "css", "xterm.css"),
  );
  const xtermCss = findFirstExisting(xtermCssCandidates);
  if (xtermCss) {
    fs.copyFileSync(xtermCss, path.join(outDir, "xterm.css"));
  }
}

export async function bundleScene(
  options: BundleSceneOptions,
): Promise<BundleSceneResult> {
  const resolvedScene = resolveComponentPath(options.componentPath);
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  copyBundledAssets(outDir);

  const runtimePath = path.resolve(
    getRendererPackageRoot(),
    "src",
    "browser",
    "runtime.tsx",
  );
  const entryPath = writeGeneratedEntry(
    outDir,
    resolvedScene,
    runtimePath,
    options,
  );
  const bundlePath = path.join(outDir, "scene-bundle.js");
  const shellPath = writeRenderShell(outDir, options.width, options.height);

  const whiteboardEntry = resolvePackageModuleEntry("@seqvio/whiteboard");
  const coreEntry = resolvePackageModuleEntry("@seqvio/core");

  const alias: Record<string, string> = {
    "@seqvio/whiteboard": whiteboardEntry,
    "@seqvio/core": coreEntry,
    // Keep the browser-only sub-path available to generated compositions that
    // import TerminalXtermDemo directly instead of through the package index.
    "@seqvio/technical/TerminalXtermDemo": resolvePackageModuleEntry(
      "@seqvio/technical",
    ).replace(/\/index\.js$/, "/TerminalXtermDemo.js"),
  };

  // Optional style packages — alias only if installed/resolvable, so the
  // renderer stays decoupled from any specific style package.
  for (const optionalStylePkg of [
    "@seqvio/scatterbrain",
    "@seqvio/product-demo",
    "@seqvio/technical",
  ]) {
    try {
      alias[optionalStylePkg] = resolvePackageModuleEntry(optionalStylePkg);
    } catch {
      // Not installed in this workspace — skip silently.
    }
  }
  try {
    await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      outfile: bundlePath,
      format: "iife",
      platform: "browser",
      target: "es2020",
      jsx: "automatic",
      // Generated compositions may live outside the caller project (for
      // example an OS temp/output directory). Resolve runtime dependencies from
      // the installed Seqvio package graph as well as from the component path.
      nodePaths: collectNodeModulesRoots(),
      loader: {
        ".tsx": "tsx",
        ".ts": "ts",
        ".json": "json",
        ".svg": "file",
        ".png": "file",
        ".jpg": "file",
        ".jpeg": "file",
        ".webp": "file",
        ".mp4": "file",
        ".woff": "file",
        ".woff2": "file",
        ".ttf": "file",
        ".otf": "file",
      },
      alias,
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      logLevel: "warning",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to bundle scene "${resolvedScene}": ${message}`);
  }

  return { bundlePath, shellPath, outDir };
}
