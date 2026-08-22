#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const audioDir = path.join(
  root,
  "output/seqvio-product-hunt-html-anything-audio",
);
const sourcePath = path.join(audioDir, "audio-manifest.resolved.json");
const startsPath = path.join(
  root,
  "output/seqvio-product-hunt-html-anything.starts.json",
);
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const starts = JSON.parse(fs.readFileSync(startsPath, "utf8"));

// The resolved manifest used for the previous render intentionally omitted
// this cue. Keep the evidence beat in the same continuous visual sequence.
if (!source.narration.some((cue) => cue.id === "visual-evidence")) {
  const index = source.narration.findIndex((cue) => cue.id === "sync");
  source.narration.splice(index < 0 ? source.narration.length : index, 0, {
    id: "visual-evidence",
    sceneId: "visuals",
    text: "<|en|>Finally, preserve the generated page and verified browser states as visual evidence",
  });
}
if (!source.tracks.some((track) => track.id === "visual-evidence")) {
  const index = source.tracks.findIndex((track) => track.id === "sync");
  source.tracks.splice(index < 0 ? source.tracks.length : index, 0, {
    id: "visual-evidence",
    src: "./narration/006-visual-evidence.wav",
    kind: "narration",
    volume: 1.8,
    offsetMs: 0,
  });
}

const tracks = source.tracks.map((track) => ({
  ...track,
  offsetMs: Math.round((starts[track.id] / source.fps) * 1000),
}));

const durationById = new Map();
const knownDurationsMs = new Map([
  ["hook", 3239],
  ["task", 9392],
  ["review", 6258],
  ["visual-whiteboard", 2914],
  ["visual-system", 3379],
  ["visual-evidence", 4354],
  ["sync", 6896],
  ["qa", 7488],
  ["applications", 10240],
  ["closing", 1800],
]);
for (const track of tracks) {
  const probe = spawnSync(
    process.platform === "win32" ? "ffprobe.exe" : "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      path.resolve(audioDir, track.src),
    ],
    { encoding: "utf8", windowsHide: true },
  );
  if (probe.status === 0 && Number.isFinite(Number(probe.stdout.trim()))) {
    durationById.set(track.id, Number(probe.stdout.trim()) * 1000);
  } else if (knownDurationsMs.has(track.id)) {
    durationById.set(track.id, knownDurationsMs.get(track.id));
  } else {
    throw new Error(probe.stderr || `ffprobe failed for ${track.id}`);
  }
}

const narration = source.narration.map((cue) => {
  const startFrame = starts[cue.id];
  const startMs = Math.round((startFrame / source.fps) * 1000);
  const endMs = Math.round(startMs + durationById.get(cue.id));
  return {
    ...cue,
    startMs,
    endMs,
    startFrame,
    endFrame: Math.round((endMs / 1000) * source.fps),
  };
});

const result = {
  ...source,
  duration: 1894,
  narration,
  tracks,
  lockToAudio: true,
};
fs.writeFileSync(sourcePath, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  `Retimed ${tracks.length} narration tracks across ${result.duration} frames`,
);
