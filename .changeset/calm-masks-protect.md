---
"@seqvio/browser-recorder": minor
"@seqvio/capture": patch
"@seqvio/terminal-narrator": patch
---

Add fail-closed selector and rectangle privacy masks for browser capture plans,
retain non-sensitive mask evidence in recording manifests, and keep the `serve`
CLI process alive until it is terminated. Promote the versioned Terminal and
Browser CLI/artifact contract to stable after the Windows/Linux/macOS runtime
matrix passed.
