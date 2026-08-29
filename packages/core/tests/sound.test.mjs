import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultSoundForVisualAction,
  intensityToVolume,
  isSoundCueName,
} from "../dist/index.js";

test("sound vocabulary validates semantic cues and visual defaults", () => {
  assert.equal(isSoundCueName("whoosh.soft"), true);
  assert.equal(isSoundCueName("remote.download"), false);
  assert.equal(defaultSoundForVisualAction("reveal"), "ui.pop");
  assert.equal(defaultSoundForVisualAction("trace"), "ui.click");
});

test("sound intensity is clamped to a safe renderer volume", () => {
  assert.equal(intensityToVolume(-1), 0);
  assert.equal(intensityToVolume(0.5), 0.4);
  assert.equal(intensityToVolume(2), 0.8);
});
