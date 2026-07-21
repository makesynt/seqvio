# Seqvio Browser Recorder MVP

A local browser walkthrough recorder that executes a validated action plan, captures the page, records cursor and focus metadata, and renders smooth focus movement with Seqvio.

## Run

From the Seqvio repository root:

```powershell
npm install
npm run build
node packages/browser-recorder/dist/cli.js serve --port 4175
```

Open `http://127.0.0.1:4175`, load the sample plan, then start a recording. Jobs are written to `output/browser-recorder/<job-id>/`:

- `plan.json` — validated action plan
- `raw.mp4` — unframed browser capture
- `recording-manifest.json` — cursor, click, and focus events
- `composition.tsx` — generated Seqvio composition
- `final.mp4` — smooth-focus result

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

## MVP boundaries

- Chromium web pages only; no desktop application control.
- CSS selectors are the deterministic execution contract.
- Authentication can be scripted, but reusable browser profiles are not included yet.
- Captures page video only. Microphone, system audio, and narration are separate Seqvio audio steps.
- Popups, downloads, cross-origin iframes, CAPTCHA, and two-factor authentication require later adapters or human takeover.
- Job state is in memory while the server is running; artifacts remain on disk.
