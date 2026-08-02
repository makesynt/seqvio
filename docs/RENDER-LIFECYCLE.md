# Render Lifecycle Contract

> **Status:** current public runtime contract for stateful and asynchronous
> Seqvio render adapters.

Seqvio may request frames in forward, reverse, repeated, or shuffled order. A
render adapter must therefore derive output from immutable input and the requested
frame. Earlier calls may warm a cache, but may not change the result.

## Adapter Stages

`SeekableAdapter` supports four asynchronous lifecycle stages:

| Stage | Meaning | Default Core timeout |
| --- | --- | ---: |
| `prepare` | Load or construct adapter-owned resources after mount | 30,000 ms |
| `ready` | Wait until prepared resources are safe to capture | 30,000 ms |
| `render` | Apply one requested frame and finish asynchronous drawing | 10,000 ms |
| `dispose` | Release adapter-owned resources | 5,000 ms |

Legacy adapters may provide only `seek(timeSeconds, frame)`. They execute inside
the same per-frame `render` deadline. Callers can provide partial timeout
overrides to `prepareSeekables`, `waitForSeekablesReady`, `renderSeekables`,
`unregisterSeekable`, and `disposeSeekables`.

`unregisterSeekable` removes an adapter before awaiting disposal. A failed or
timed-out cleanup therefore cannot leave that adapter active for later frames.
Browser render sessions call the explicit runtime dispose barrier before closing
or reloading their page.

## Browser Readiness Barriers

The browser runtime reports its active stage through `__seqvio_lifecycle` and
applies outer deadlines to framework resources:

| Runtime stage | Deadline |
| --- | ---: |
| fonts | 30,000 ms |
| initial images, video metadata, xterm, and first paint | 30,000 ms |
| adapter prepare or ready barrier | 35,000 ms |
| adapter render or per-frame resources | 15,000 ms |
| explicit browser disposal | 10,000 ms |

The outer adapter deadlines are intentionally longer than Core deadlines, so a
specific adapter error normally wins over a generic browser-stage timeout.

## Diagnostics

Core failures throw `RenderLifecycleError` with stable fields:

- `code`: `render_lifecycle_timeout` or `render_lifecycle_failed`
- `adapterId`
- `phase`
- `frame` for render failures
- `timeoutMs` for timeouts
- `cause` for adapter failures

Browser-shell failures begin with `render_runtime_failed` and include the
operation plus the last reported stage, status, frame, and deadline. Runtime
deadline messages begin with `render_runtime_timeout`.

These errors are render failures, not QA warnings. Increasing a timeout is
appropriate only for a known, bounded resource cost. A resource that can wait
forever must be fixed or explicitly degraded by its owning component.
