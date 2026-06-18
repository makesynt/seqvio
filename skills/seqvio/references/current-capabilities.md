# Current Capabilities

This reference describes what Seqvio supports today in this repository. Treat planning docs and proposals as direction, not shipped behavior.

## Production loop

```text
content -> host agent -> storyboard IR -> TSX composition -> audio manifest -> TTS synthesis -> seqvio-render -> MP4
```

For new storyboard-driven topics, prefer:

```text
seqvio-generate plan-agent -> host agent returns IR -> validate -> compile -> seqvio-render
```

Seqvio does not call AI or planner APIs. The host agent creates the IR; Seqvio validates and compiles it deterministically.

## Authoring

- React/TSX composition files
- Required exports: default component + `meta`
- Timing is in frames, not seconds
- Single-scene whiteboard compositions via `@seqvio/whiteboard`
- Multi-scene compositions via `@seqvio/core`

## Whiteboard components

From `@seqvio/whiteboard`:

- `WhiteboardScene`
- `DrawText`
- `DrawShape`
- `DrawImage`
- `Hand`

`WhiteboardScene` defaults to `singlePen={true}`, so overlapping draw actions are serialized.

## Core composition components

From `@seqvio/core`:

- `VideoComposition`
- `Scene`
- `Transition`

Implemented transitions: `fade`, `slide`, `wipe`

Unknown transition names fall back to `fade`.

## CLI tools

From `@seqvio/renderer`:

- `seqvio-generate plan-agent` — write a host-agent task for storyboard IR generation
- `seqvio-generate` — storyboard IR to TSX
- `seqvio-generate validate` — IR validation
- `seqvio-generate validate --json` — agent-friendly validation diagnostics
- `seqvio-render` — TSX to MP4
- `seqvio-audio extract` — narration manifest extraction
- `seqvio-audio synthesize` — TTS synthesis and resolved manifest generation

## Narration providers

`seqvio-audio synthesize` supports:

- ElevenLabs (default)
- OpenAI
- MiniMax
- edge-tts

Credentials come from environment variables. The CLI does not auto-load `.env`.

## Audio-aligned compositions

Supported today:

- `meta.audio.narration` cue lists
- per-cue `sceneId`
- `lockToAudio: true`
- resolved manifest driven scene timing
- caption burn-in via `--burnCaptions`

## Example compositions

Preferred starting points:

| File | Use case |
| --- | --- |
| `examples/compositions/seqvio-overview-en.tsx` | Narrated English product overview |
| `examples/compositions/seqvio-overview-zh.tsx` | Narrated Chinese product overview |
| `examples/compositions/seqvio-audio-demo.tsx` | Audio and caption metadata |
| `examples/compositions/seqvio-intro.tsx` | Multi-scene framework intro |
| `packages/whiteboard/examples/` | Single-scene whiteboard samples |

Tracked README demo videos:

- `docs/assets/videos/seqvio-overview-en.mp4`
- `docs/assets/videos/seqvio-overview-zh.mp4`

Local render intermediates belong in `output/` and are gitignored.

## Repository layout

| Path | Purpose |
| --- | --- |
| `packages/whiteboard` | Whiteboard components |
| `packages/core` | Scene and transition runtime |
| `packages/renderer` | Bundler and CLIs |
| `examples/compositions/` | Renderable compositions |
| `skills/seqvio/` | Agent skill and references |
| `docs/` | Human-facing docs |

## Not implemented yet

Do not assume these exist just because they appear in roadmap or proposal docs:

- visual editor / studio workflow
- automatic custom SVG illustration generation per topic
- Seqvio-side AI planning or planner API calls
- transitions beyond `fade`, `slide`, and `wipe`

When in doubt, verify against source code and [`docs/COMPOSITION-AUTHORING.md`](../../../docs/COMPOSITION-AUTHORING.md).
