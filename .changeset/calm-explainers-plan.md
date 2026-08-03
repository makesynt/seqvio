---
"@seqvio/core": minor
"@seqvio/renderer": minor
"@seqvio/capture": minor
"@seqvio/browser-recorder": minor
"@seqvio/terminal-narrator": minor
---

Add human-readable editorial and visual-design authoring artifacts, and rename
the executable CompositionDocument v2 contract to ExplainerDocument. The IR now
uses `format: "seqvio-explainer"` with an implementation-only `schemaVersion`,
agent planning requires approved authoring artifacts, and capture jobs emit
`explainer.json` under capture CLI contract 2.0.
