# Manim Integration

Seqvio integrates the Python package `manim` as an optional external renderer
for mathematical animation. `@seqvio/manim-adapter` is a TypeScript/Node.js
adapter; it does not reimplement Manim in JavaScript and it does not run Python
inside the browser renderer.

The integration has two stages:

```text
Python scene (`.py`)
  -> @seqvio/manim-adapter -> rendered video + ManimRenderManifest
  -> ExplainerDocument `manim` scene or @seqvio/technical `ManimClip`
  -> ExplanationBeats + seqvio-qa + seqvio-render
  -> final MP4
```

Use Manim when an explanation needs equation transformation, graph animation,
geometric construction, or another visual that is best authored in the Python
Manim ecosystem. Keep the rest of the explanation in Seqvio so narration,
attention, annotations, captured evidence, and final rendering share one
timeline.

## Lifecycle and requirements

`@seqvio/manim-adapter` is currently an experimental workspace package. Its API
or packaging may change before lifecycle promotion. `ManimClip` is part of the
public `@seqvio/technical` package.

Required for adapter rendering:

- Node.js 18 or newer and a built Seqvio repository checkout
- Python with the `manim` package installed
- Manim's platform dependencies, including FFmpeg
- `ffprobe` for validating the rendered media contract

The repository fixtures are validated with `manim==0.20.1`. A project may use a
different compatible version, but the Python and Manim versions participate in
the render cache key and are recorded in the manifest.

## Install a local Manim environment

Create a repository-local virtual environment from the repository root:

```powershell
# Windows PowerShell
python -m venv .venv-manim
.\.venv-manim\Scripts\python.exe -m pip install manim==0.20.1
.\.venv-manim\Scripts\python.exe -m manim --version
```

```bash
# macOS or Linux
python3 -m venv .venv-manim
./.venv-manim/bin/python -m pip install manim==0.20.1
./.venv-manim/bin/python -m manim --version
```

Manim may require additional OS packages. Follow the Manim installation
instructions for the target platform when `pip install` reports a missing
native dependency.

`seqvio-doctor` automatically checks `.venv-manim` in the current repository.
To use another interpreter, set `SEQVIO_MANIM_PYTHON` to its executable path:

```powershell
$env:SEQVIO_MANIM_PYTHON = "C:\path\to\venv\Scripts\python.exe"
npm run doctor
```

```bash
export SEQVIO_MANIM_PYTHON=/path/to/venv/bin/python
npm run doctor
```

The adapter API and repository render helper also accept an explicit
`pythonCommand` or `--python` value.

## Render through the adapter

Build the workspaces first:

```bash
npm ci
npm run build
```

Declare the external render in a JSON file such as `temp/equation.scene.json`:

```json
{
  "format": "seqvio-manim-scene",
  "version": "1.0",
  "id": "equation",
  "pythonFile": "examples/manim/equation.py",
  "className": "EquationDerivation",
  "width": 1280,
  "height": 720,
  "fps": 30,
  "quality": "medium",
  "args": ["--media_dir", "output/manim-media"],
  "assets": []
}
```

The Manim command and its `--media_dir` argument determine the output location.
Pass that exact expected MP4 path to the adapter helper:

```powershell
node scripts/manim-adapter-render.mjs `
  --scene temp/equation.scene.json `
  --expectedOutput output/manim-media/videos/equation/720p30/EquationDerivation.mp4 `
  --manifest output/manim-media/equation.manifest.json `
  --python .\.venv-manim\Scripts\python.exe
```

```bash
node scripts/manim-adapter-render.mjs \
  --scene temp/equation.scene.json \
  --expectedOutput output/manim-media/videos/equation/720p30/EquationDerivation.mp4 \
  --manifest output/manim-media/equation.manifest.json \
  --python ./.venv-manim/bin/python
```

Set Manim-specific output arguments in `args` when the Python scene does not
already write to the expected location. The helper exits nonzero when Python or
Manim is unavailable, the child process fails, or the expected media cannot be
probed.

The adapter manifest records the command, source and asset hashes, runtime
versions, dimensions, frame rate, duration, alpha mode, diagnostics, and cache
identity. Identical source, assets, settings, and runtimes reuse the validated
cached output.

## Add the rendered media to a Seqvio explanation

An `ExplainerDocument` references the pre-rendered media rather than the Python
source:

```json
{
  "type": "manim",
  "id": "equation",
  "sourceVideo": "file:///absolute/path/to/EquationDerivation.mp4",
  "sourceManifest": "output/manim-media/equation.manifest.json",
  "mediaWidth": 1280,
  "mediaHeight": 720,
  "mediaFps": 30,
  "duration": 150,
  "fit": "contain",
  "markers": [
    { "id": "initial-form", "frame": 0 },
    {
      "id": "result",
      "frame": 90,
      "beatId": "show-result",
      "targetId": "equation-result"
    }
  ]
}
```

The compiler turns this scene into `ManimClip`. A marker with `beatId` follows
the resolved `ExplanationBeat` frame after narration synthesis; a marker without
`beatId` remains at its authored media frame. `targetId` exposes a stable target
for shared annotation and attention primitives.

For hand-authored TSX, import the component directly:

```tsx
import { ManimClip } from "@seqvio/technical";

<ManimClip
  id="equation"
  src="file:///absolute/path/to/EquationDerivation.mp4"
  width={1280}
  height={720}
  fps={30}
  markers={[{ id: "result", frame: 90, beatId: "show-result" }]}
/>;
```

`ManimClip` is seekable and deterministic: Seqvio maps the current composition
frame to the external video instead of letting it free-play. Run `seqvio-qa`
after compilation to validate media readability, dimensions, timing, markers,
and seek behavior.

## Repository examples

- [`../examples/manim/`](../examples/manim/) contains equation, graph, symbolic
  proof, and geometric proof Python scenes.
- [`../examples/ir/manim-real-validation.explainer.json`](../examples/ir/manim-real-validation.explainer.json)
  shows the `ExplainerDocument` scene contract. Its absolute `sourceVideo` is a
  local validation artifact and must be replaced after rendering on another
  machine.
- [`../examples/compositions/manim-end-to-end-validation.tsx`](../examples/compositions/manim-end-to-end-validation.tsx)
  demonstrates narrated graph and proof playback through `ManimClip`.

## Troubleshooting

- `python_not_found`: pass the correct interpreter through
  `SEQVIO_MANIM_PYTHON`, `pythonCommand`, or `--python`.
- `manim_not_found`: install `manim` into the same interpreter selected above.
- `missing_asset:<path>`: add or correct every external file declared in
  `assets`; declared asset contents participate in cache invalidation.
- `missing_or_unreadable_media`: make `--expectedOutput` match Manim's actual
  output path and confirm `ffprobe` can read it.
- `incomplete_media_contract`: verify that the generated file reports width,
  height, frame rate, duration, and pixel format.
- A stale-looking result: Python, Manim, source files, declared assets, and
  render settings are hashed. Declare every file read by the Python scene in
  `assets` so changes invalidate the cache.
