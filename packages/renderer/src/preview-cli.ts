#!/usr/bin/env node
/**
 * seqvio-preview — local browser preview with play/scrub controls.
 *
 *   seqvio-preview --component scene.tsx [--port 5173]
 *
 * Bundles the composition with the SAME esbuild pipeline used for rendering
 * (bundleScene), then serves it with a thin control overlay that drives the
 * already-existing browser runtime globals (__seqvio_setFrame / __seqvio_getMeta).
 * This gives a sub-second author feedback loop without rendering an MP4 — frame
 * state is identical to what the renderer captures, so what you scrub is what
 * you get.
 */

import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { bundleScene, resolveComponentPath } from './bundle-scene';
import { SEQVIO_BRAND, runtimeGlobalName } from './brand';

interface PreviewArgs {
  component: string;
  port: number;
  width: number;
  height: number;
  fps: number;
  duration?: number;
}

function printUsage(): void {
  console.log(`Usage:
  seqvio-preview --component <path> [options]

Options:
  --component <path>   Path to TSX/TS composition (required)
  --port <number>      HTTP port (default: 5173)
  --width <number>     Viewport width (default: 1280)
  --height <number>    Viewport height (default: 720)
  --fps <number>       Default fps if meta omits it (default: 30)
  --duration <number>  Default duration (frames) if meta omits it
  --help
`);
}

function parseArgs(argv: string[]): PreviewArgs {
  const args = new Map<string, string | boolean>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'help') {
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
  if (typeof component !== 'string') {
    printUsage();
    throw new Error('--component is required');
  }

  return {
    component: path.resolve(component),
    port: Number(args.get('port') ?? 5173),
    width: Number(args.get('width') ?? 1280),
    height: Number(args.get('height') ?? 720),
    fps: Number(args.get('fps') ?? 30),
    duration: args.get('duration') !== undefined ? Number(args.get('duration')) : undefined,
  };
}

/** Control-bar overlay injected into the preview page (not the render shell). */
function previewHtml(width: number, height: number): string {
  const setFrame = runtimeGlobalName('setFrame');
  const getMeta = runtimeGlobalName('getMeta');
  const ready = runtimeGlobalName('ready');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${SEQVIO_BRAND.name} Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1e1e22; font-family: system-ui, sans-serif; color: #e7e7ea; }
    #stage-wrap { display: flex; justify-content: center; padding: 16px; }
    #root {
      width: ${width}px; height: ${height}px;
      background: #fff; position: relative; overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    #controls {
      position: fixed; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px; background: #2a2a30; border-top: 1px solid #3a3a42;
    }
    #controls button {
      background: #3b82f6; color: #fff; border: none; border-radius: 6px;
      padding: 6px 14px; font-size: 14px; cursor: pointer;
    }
    #controls button:disabled { opacity: 0.5; cursor: default; }
    #scrub { flex: 1; }
    .mono { font-variant-numeric: tabular-nums; font-size: 13px; color: #b8b8c0; }
  </style>
</head>
<body>
  <div id="stage-wrap"><div id="root"></div></div>
  <div id="controls">
    <button id="play">Play</button>
    <input id="scrub" type="range" min="0" max="0" value="0" step="1" />
    <span class="mono" id="readout">0 / 0</span>
  </div>
  <script src="./scene-bundle.js"></script>
  <script>
    (function () {
      var setFrame = function (f) { return window['${setFrame}'](f); };
      var getMeta = function () { return window['${getMeta}'](); };

      var playBtn = document.getElementById('play');
      var scrub = document.getElementById('scrub');
      var readout = document.getElementById('readout');

      var duration = 1, fps = 30, current = 0, playing = false, rafId = null;

      function render(frame) {
        current = Math.max(0, Math.min(frame, duration - 1));
        scrub.value = String(current);
        readout.textContent = current + ' / ' + (duration - 1) +
          '  (' + (current / fps).toFixed(2) + 's)';
        return setFrame(current);
      }

      function tick() {
        if (!playing) return;
        var next = current + 1;
        if (next >= duration) { stop(); return; }
        render(next).then(function () {
          rafId = requestAnimationFrame(tick);
        });
      }

      function play() { if (playing) return; playing = true; playBtn.textContent = 'Pause'; tick(); }
      function stop() { playing = false; playBtn.textContent = 'Play'; if (rafId) cancelAnimationFrame(rafId); }

      playBtn.addEventListener('click', function () { playing ? stop() : play(); });
      scrub.addEventListener('input', function () { stop(); render(Number(scrub.value)); });
      document.addEventListener('keydown', function (e) {
        if (e.key === ' ') { e.preventDefault(); playing ? stop() : play(); }
        else if (e.key === 'ArrowRight') { stop(); render(current + 1); }
        else if (e.key === 'ArrowLeft') { stop(); render(current - 1); }
      });

      function waitReady() {
        if (window['${ready}'] === true) {
          var meta = getMeta();
          duration = Math.max(1, meta.duration || 1);
          fps = Math.max(1, meta.fps || 30);
          scrub.max = String(duration - 1);
          render(0);
        } else {
          setTimeout(waitReady, 50);
        }
      }
      waitReady();
    })();
  </script>
</body>
</html>`;
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const resolvedComponent = resolveComponentPath(args.component);

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-preview-'));
  await bundleScene({
    componentPath: resolvedComponent,
    outDir,
    width: args.width,
    height: args.height,
    fps: args.fps,
    duration: args.duration,
    burnCaptions: false,
  });

  // Overwrite the render shell's index with the interactive preview page.
  fs.writeFileSync(path.join(outDir, 'index.html'), previewHtml(args.width, args.height), 'utf8');

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const filePath = path.join(outDir, rel);

    // Contain requests to the bundle directory.
    if (!filePath.startsWith(outDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(args.port, () => {
    console.log(`\n${SEQVIO_BRAND.name} preview running:`);
    console.log(`  http://localhost:${args.port}`);
    console.log(`  component: ${resolvedComponent}`);
    console.log('\nControls: Space = play/pause, ←/→ = step frame. Ctrl+C to stop.\n');
  });

  const shutdown = () => {
    server.close();
    fs.rmSync(outDir, { recursive: true, force: true });
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`seqvio-preview failed: ${message}`);
  process.exit(1);
});
