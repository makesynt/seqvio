# Seqvio Browser Capture Adapter

A local, pre-stable browser walkthrough adapter that executes a validated action
plan, captures the page, records cursor/focus/click metadata and exact action
start times, then compiles the capture through `CompositionDocument v2`.

```text
BrowserRecordingPlan
  -> RecordingManifest
  -> BrowserCaptureManifest
  -> shared capture dispatcher
  -> BrowserSceneSpec + ExplanationBeat cues/actions
  -> generated TSX + audio-manifest.json
  -> final.mp4
```

The default server pipeline renders without TTS. Direct CLI jobs can synthesize
voiceover with `--withAudio`; hard captions remain independent and require the
additional `--burnCaptions` flag. Every server and direct job runs capture QA
before it is marked complete.

The production pipeline has one composition path. The former direct
`writeComposition` writer has been removed; `composition.tsx` and
`audio-manifest.json` are generated from the dispatched CompositionDocument.

## Run

From the Seqvio repository root:

```powershell
npm install
npm run build
node packages/browser-recorder/dist/cli.js serve --port 4175
```

Open `http://127.0.0.1:4175`, load the sample plan, then start a recording. Jobs are written to `output/browser-recorder/<job-id>/`:

Run a validated plan directly without the UI:

```powershell
node packages/browser-recorder/dist/cli.js record --plan plan.json --jobId demo --json

# Optional narration; add --burnCaptions only when hard subtitles are wanted
node packages/browser-recorder/dist/cli.js record --plan plan.json --jobId narrated --withAudio --provider edge-tts
```

- `plan.json` — validated action plan
- `raw.mp4` — unframed browser capture
- `recording-manifest.json` — cursor, click, focus, and exact action timing
- `capture-manifest.json` — shared capture contract
- `composition-document.json` — canonical IR
- `audio-manifest.json` — per-step narration cues, capture-backed Beats, and scene timing
- `composition.tsx` — generated Seqvio composition compiled from IR
- `final.mp4` — smooth-focus result
- `qa-report.json` — capture, visual, pacing, media, and audio diagnostics
- `artifacts.json` — versioned status and relative artifact paths

CLI contract `1.0` provides structured JSON output, stable exit codes, monotonic
progress, and overwrite protection. See
[`docs/CAPTURE-CLI-CONTRACT.md`](../../docs/CAPTURE-CLI-CONTRACT.md).

## Action plan

```json
{
  "version": "1.0",
  "name": "Create a project",
  "startUrl": "https://example.com/app",
  "viewport": { "width": 1280, "height": 720 },
  "captureFps": 15,
  "renderFps": 30,
  "maxZoom": 2.2,
  "actions": [
    {
      "id": "project-name",
      "type": "fill",
      "label": "Enter project name",
      "selector": "#project-name",
      "value": "Launch walkthrough"
    },
    {
      "id": "create",
      "type": "click",
      "label": "Create project",
      "selector": "button[type=submit]"
    }
  ]
}
```

Supported actions: `click`, `fill`, `scroll`, `wait`, `navigate`, and `press`.

## AI planner adapter

The recorder does not force one model provider. Set `BROWSER_RECORDER_PLANNER_URL` to an HTTP endpoint. The endpoint receives the task, start URL, viewport, a compact list of interactive DOM elements, and the output contract. Return either a plan object or `{ "plan": ... }`.

Optional bearer authentication:

```powershell
$env:BROWSER_RECORDER_PLANNER_URL="http://127.0.0.1:9000/plan"
$env:BROWSER_RECORDER_PLANNER_TOKEN="token"
```

The UI enables **AI 规划** only when the planner URL is configured. Generated plans are validated and remain editable before execution.

## Current boundaries

- Chromium web pages only; no desktop application control.
- CSS selectors are the deterministic execution contract.
- Authentication can be scripted, but reusable browser profiles are not included yet.
- Captures page video only. Microphone and system audio are not recorded. Narration is synthesized from the generated cues when direct CLI jobs use `--withAudio`.
- Popups, downloads, cross-origin iframes, CAPTCHA, and two-factor authentication require later adapters or human takeover.
- Job state is in memory while the server is running; artifacts remain on disk.

## Timing and QA

New recordings persist `actionTimings` from the recording clock. Capture steps
use these exact values; evenly spaced timing is only a compatibility fallback
for older manifests. Each compiled step becomes an ExplanationBeat whose
`evidence.captureStepId` preserves the recorded source frame. After TTS, phrase
anchors produce `outputFrame` values and a semantic browser-video `timeMap`.

From the repository root, the deterministic 1280x720 release smoke covers the
Browser capture, IR compilation, resolved timing, capture-profile QA, MP4 render,
and full FFmpeg decode:

```powershell
npm run smoke:release-pipeline:browser
```
