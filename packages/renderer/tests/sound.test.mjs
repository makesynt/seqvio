import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  diagnoseResolvedSoundTracks,
  formatSoundDesignMarkdown,
  loadLocalSoundAssetRegistry,
  planSoundDesign,
  resolveLocalSoundCues,
  validateLocalSoundAssetRegistry,
  validateSoundCueCoverage,
} from "../dist/audio/sound.js";

test("local sound registry resolves beat cues into deterministic SFX tracks", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seqvio-sound-test-"));
  fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "assets", "click.wav"),
    Buffer.from("placeholder"),
  );
  const registryPath = path.join(dir, "registry.json");
  fs.writeFileSync(
    registryPath,
    JSON.stringify({
      "ui.click": [
        { id: "click-01", file: "assets/click.wav", durationMs: 120 },
      ],
    }),
  );
  const manifest = {
    fps: 30,
    tracks: [{ id: "voice", src: "audio/voice.wav", kind: "narration" }],
    sceneTimings: [
      {
        sceneId: "scene",
        startFrame: 30,
        durationFrames: 90,
        sourceDurationFrames: 90,
      },
    ],
    explanationBeats: [
      {
        id: "scene.connect",
        sceneId: "scene",
        cueId: "scene.voice",
        sourceFrame: 15,
        anchor: { text: "connect" },
        visuals: [{ targetId: "edge", action: "trace" }],
        sounds: [
          {
            cue: "ui.click",
            repeat: 2,
            staggerMs: 80,
            intensity: 0.5,
            offsetMs: 25,
          },
        ],
      },
    ],
  };
  const result = resolveLocalSoundCues(manifest, registryPath, {
    outputManifestPath: path.join(dir, "resolved", "out.json"),
    sourceManifestBaseDir: dir,
  });
  assert.equal(result.cues.length, 2);
  assert.equal(result.cues[0].startMs, 1525);
  assert.equal(result.cues[1].startMs, 1605);
  assert.equal(result.tracks[0].src, "../audio/voice.wav");
  assert.equal(result.tracks[1].kind, "sfx");
  assert.equal(result.tracks[1].sourceCue, "ui.click");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("local sound registry reports missing files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seqvio-sound-registry-"));
  const registryPath = path.join(dir, "registry.json");
  fs.writeFileSync(
    registryPath,
    JSON.stringify({
      "ui.pop": [{ id: "pop-01", file: "missing.wav", durationMs: 100 }],
    }),
  );
  const loaded = loadLocalSoundAssetRegistry(registryPath);
  const issues = validateLocalSoundAssetRegistry(
    loaded.registry,
    loaded.baseDir,
  );
  assert.ok(issues.some((issue) => issue.code === "missing_sound_asset_file"));
  fs.rmSync(dir, { recursive: true, force: true });
});

test("sound registry coverage reports missing cues and variants before resolution", () => {
  const manifest = {
    explanationBeats: [
      {
        id: "scene.sound",
        sceneId: "scene",
        cueId: "voice",
        sourceFrame: 0,
        anchor: { text: "sound" },
        visuals: [],
        sounds: [
          { cue: "ui.click", variant: "missing" },
          { cue: "impact.soft" },
        ],
      },
    ],
  };
  const issues = validateSoundCueCoverage(manifest, {
    "ui.click": [{ id: "click", file: "click.wav", durationMs: 100 }],
  });
  assert.deepEqual(
    issues.map((issue) => issue.code),
    ["unregistered_sound_variant", "unregistered_sound_cue"],
  );
});

test("sound plan keeps authored cues and proposes defaults for visual-only beats", () => {
  const manifest = {
    fps: 30,
    sceneTimings: [{ sceneId: "scene", startFrame: 30, durationFrames: 120 }],
    explanationBeats: [
      {
        id: "scene.reveal",
        sceneId: "scene",
        cueId: "voice",
        sourceFrame: 15,
        anchor: { text: "reveal" },
        visuals: [{ targetId: "card", action: "reveal" }],
      },
      {
        id: "scene.hit",
        sceneId: "scene",
        cueId: "voice",
        sourceFrame: 45,
        anchor: { text: "hit" },
        visuals: [{ targetId: "title", action: "emphasize" }],
        sounds: [{ cue: "impact.soft", intensity: 0.5 }],
      },
    ],
  };
  const plan = planSoundDesign(manifest);
  assert.equal(plan.length, 2);
  assert.equal(plan[0].cue, "ui.pop");
  assert.equal(plan[0].source, "suggested");
  assert.equal(plan[1].cue, "impact.soft");
  assert.match(formatSoundDesignMarkdown(plan), /\| ui\.pop \|/);
});

test("sound diagnostics flag dense repetition and unducked prominent cues", () => {
  const manifest = {
    fps: 30,
    duration: 300,
    narration: [{ id: "voice", text: "Narration", startMs: 0, endMs: 3000 }],
    tracks: Array.from({ length: 7 }, (_, index) => ({
      id: `hit-${index}`,
      src: "hit.wav",
      kind: "sfx",
      sourceCue: "impact.deep",
      assetId: "same-hit",
      offsetMs: index * 100,
      durationMs: 500,
      volume: 0.5,
      duckUnderNarration: false,
    })),
  };
  const codes = new Set(
    diagnoseResolvedSoundTracks(manifest).map((issue) => issue.code),
  );
  assert.ok(codes.has("sound_density_high"));
  assert.ok(codes.has("repeated_sound_asset"));
  assert.ok(codes.has("sound_narration_overlap"));
});
