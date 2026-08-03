# Capture CLI Contract

> Current contract version: `1.0`
> Adapter lifecycle: `pre-stable`

Terminal and Browser adapters share command, result, exit-code, QA, audio, and
artifact conventions. The contract is versioned while supported-host
verification remains pre-stable.

## Commands

```powershell
# Terminal
seqvio-terminal record --plan plan.json --outputDir output/terminal --jobId demo
seqvio-terminal record --sample --json

# Browser UI server
seqvio-browser serve --port 4175 --outputDir output/browser

# Browser direct plan execution
seqvio-browser record --plan plan.json --outputDir output/browser --jobId demo --json
```

Both CLIs support `--help`, `--version`, `--json`, `--outputDir`, and explicit
`--jobId` values. Job ids are limited to 1-64 letters, numbers, dots,
underscores, or hyphens. A non-empty existing job directory is rejected.

Both direct record commands also support `--withAudio`, `--provider`, `--voice`,
`--burnCaptions`, and `--qaConfig`. Audio synthesis and hard captions are
independent: `--burnCaptions` requires `--withAudio`, while audio alone does not
alter the frames.

`seqvio-recorder` remains a Browser CLI alias. Its legacy `--output` serve
option is accepted as an alias for `--outputDir`.

## JSON Mode

With `--json`, stdout contains exactly one final JSON object. Progress messages
go to stderr. Success includes:

```json
{
  "ok": true,
  "cliContractVersion": "1.0",
  "lifecycle": "pre-stable",
  "adapter": "terminal",
  "jobId": "demo",
  "jobDir": ".../demo",
  "artifactManifestPath": ".../demo/artifacts.json",
  "outputVideoPath": ".../demo/final.mp4"
}
```

Failures use the same envelope with `ok: false`, a stable `exitCode`, and an
`error.code` plus human-readable `error.message`.

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `2` | Invalid command, option, plan, job id, or conflicting input |
| `3` | Capture, compilation, synthesis, server, render, or QA failure |
| `4` | Unexpected CLI-internal failure |

## Job Artifacts

Every completed job writes `artifacts.json`. Failed jobs write it after the job
directory has been created. Paths inside it are relative to the job directory.

| Artifact | Terminal | Browser |
| --- | --- | --- |
| `plan.json` | yes | yes |
| `recording-manifest.json` | yes | yes |
| `capture-manifest.json` | yes | yes |
| `explainer.json` | yes | yes |
| `composition.tsx` | yes | yes |
| `audio-manifest.json` | yes | yes |
| `audio-manifest.resolved.json` | with audio | with audio |
| `session.cast` | yes | no |
| `raw.mp4` | no | yes |
| `final.mp4` | yes | yes |
| `qa-report.json` | yes | yes |
| `artifacts.json` | yes | yes |

The Browser server exposes the same manifest at
`GET /api/jobs/<job-id>/artifacts` after a job completes.

## QA Gate

Every recording runs the capture QA profile after rendering. A QA error keeps
all diagnostic artifacts, marks `artifacts.json` as failed, and returns exit
code `3`. Jobs without `--withAudio` still receive capture, visual, pacing, and
media checks but explicitly do not require a narration track. Jobs requesting
audio must contain a valid narration track. Warnings remain in `qa-report.json`;
`--qaConfig` controls auditable suppressions and warning promotion.

## Progress

Progress percentages are monotonically mapped across recording, composition,
synthesis, rendering, encoding, cleanup, and QA. Consumers should use `phase`
and `message` rather than infer sub-step meaning from percentage alone.

## Current Boundary

Contract `1.0` is implemented and covered by tests. Windows package/CLI host
verification passes locally; a Windows/Linux/macOS CI matrix verifies clean
installation, build, adapter tests, npm package contents, and CLI contract.
Adapters remain pre-stable until that matrix passes on the repository host.
Screenshot OCR/masking is not part of this contract and remains intentionally
deferred; raw Browser capture must be treated as sensitive input.
