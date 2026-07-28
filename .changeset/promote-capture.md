---
"@seqvio/core": minor
"@seqvio/renderer": minor
"@seqvio/capture": minor
"@seqvio/terminal-narrator": minor
"@seqvio/browser-recorder": minor
---
Add `@seqvio/capture` contract package; migrate terminal/browser pipelines to IR (record -> CaptureManifest -> CompositionDocument IR -> compileCompositionDocumentToTsx -> tsx -> render) with visual control via renderOptions; seqvio-qa adds text-overflow/font-size/contrast checks + narration/visual agreement + `--ci` + repair hints; BrowserSceneSpec + TerminalRenderOptions in the IR. terminal-narrator/browser-recorder promoted out of private (publishable).
