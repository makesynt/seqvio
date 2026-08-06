# @seqvio/manim-adapter

Experimental TypeScript/Node.js adapter for the Python package `manim`.

The package validates a versioned `ManimSceneSpec`, invokes a selected Python
interpreter with `python -m manim`, probes the resulting media, and writes a
content-addressed `ManimRenderManifest`. It does not contain a JavaScript Manim
implementation and does not run Python in the browser.

Use the rendered media with `ManimClip` from `@seqvio/technical` or a `manim`
scene in Seqvio's `ExplainerDocument`.

## Requirements

- Node.js 18 or newer
- Python with the `manim` package installed
- Manim's system dependencies and FFmpeg
- `ffprobe` for output validation

The repository fixtures currently use `manim==0.20.1`.

## API

```ts
import {
  executeManimScene,
  preflightManim,
  type ManimSceneSpec,
} from "@seqvio/manim-adapter";

const pythonCommand = process.env.SEQVIO_MANIM_PYTHON ?? "python";
const scene: ManimSceneSpec = {
  format: "seqvio-manim-scene",
  version: "1.0",
  id: "equation",
  pythonFile: "examples/manim/equation.py",
  className: "EquationDerivation",
  width: 1280,
  height: 720,
  fps: 30,
  quality: "medium",
  args: ["--media_dir", "output/manim-media"],
  assets: [],
};

const preflight = preflightManim(pythonCommand);
const manifest = await executeManimScene(scene, {
  cwd: process.cwd(),
  cacheDir: "output/manim-cache",
  expectedOutputPath:
    "output/manim-media/videos/equation/720p30/EquationDerivation.mp4",
  pythonCommand,
  preflight,
  onProgress: console.log,
});

if (manifest.status !== "rendered") {
  throw new Error(manifest.diagnostics.join(", "));
}
```

`pythonCommand` may be `python`, `python3`, or an absolute virtual-environment
interpreter path. The cache key includes the scene contract, Python source,
declared assets, render settings, Python version, and Manim version.

See the complete [Manim integration guide](../../docs/MANIM-INTEGRATION.md) for
environment setup, the repository CLI helper, `ExplainerDocument`, markers,
`ExplanationBeat` alignment, and troubleshooting.
