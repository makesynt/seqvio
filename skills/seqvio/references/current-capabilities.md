# Current Capabilities

This reference describes what Seqvio supports today in this repository. Treat planning docs and proposals as direction, not shipped behavior.

## Production loop

```text
TSX composition -> audio manifest -> TTS synthesis -> seqvio-render -> MP4
```

Agents and contributors should follow this loop unless the task is explicitly a silent whiteboard render.

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

- AI scene generation CLI
- visual editor / studio workflow
- storyboard JSON authoring
- template auto-layout
- transitions beyond `fade`, `slide`, and `wipe`

When in doubt, verify against source code and [`docs/COMPOSITION-AUTHORING.md`](../../../docs/COMPOSITION-AUTHORING.md).
