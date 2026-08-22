#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(
  root,
  "output/seqvio-product-hunt-html-anything-audio/audio-manifest.resolved.json",
);
const videoPath = path.join(
  root,
  "output/seqvio-product-hunt-html-anything-visual-v9.mp4",
);
const outputPath = path.join(
  root,
  process.argv.includes("--sfx-preview")
    ? "output/seqvio-product-hunt-html-anything-sfx-preview.mp4"
    : "output/seqvio-product-hunt-html-anything-final.mp4",
);
const duration = 64.33;
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const sfxBusGain = 1.2;

const sfxRoot = path.join(root, "output/mixkit-neutral-audio");
const sfxEvents = [
  ["1474-transition-windy-swoosh.mp3", 2850, 0.055],
  ["3124-modern-technology-select.mp3", 3750, 0.045],
  ["1386-keyboard.mp3", 4300, 0.1],
  ["2997-clear-mouse-clicks.mp3", 8750, 0.085],
  ["2577-interface-device-click.mp3", 13400, 0.06],
  ["1113-mouse-click-close.mp3", 27400, 0.08],
  ["1109-select-click.mp3", 39570, 0.075],
  ["2577-interface-device-click.mp3", 47730, 0.065],
  ["2585-light-switch-tap.mp3", 49500, 0.06],
  ["2997-clear-mouse-clicks.mp3", 51300, 0.06],
  ["1117-classic-click.mp3", 53100, 0.06],
  ["1109-select-click.mp3", 54900, 0.06],
  ["1489-air-woosh.mp3", 57270, 0.045],
  ["2299-short-bass-hit.mp3", 57700, 0.032],
];
const sfxProfiles = {
  "1474-transition-windy-swoosh.mp3": { start: 0.05, duration: 0.72, fadeOut: 0.2 },
  "3124-modern-technology-select.mp3": { start: 0, duration: 0.28, fadeOut: 0.08 },
  "3120-technology-transition-slide.mp3": { start: 0, duration: 0.65, fadeOut: 0.16 },
  "2578-opening-software-interface.mp3": { start: 0, duration: 0.7, fadeOut: 0.16 },
  "1386-keyboard.mp3": { start: 0.15, duration: 4.2, fadeOut: 0.35 },
  "2997-clear-mouse-clicks.mp3": { start: 0, duration: 0.9, fadeOut: 0.12 },
  "2577-interface-device-click.mp3": { start: 0, duration: 0.55, fadeOut: 0.12 },
  "1113-mouse-click-close.mp3": { start: 0, duration: 0.65, fadeOut: 0.12 },
  "1109-select-click.mp3": { start: 0, duration: 0.55, fadeOut: 0.12 },
  "2585-light-switch-tap.mp3": { start: 0, duration: 0.55, fadeOut: 0.12 },
  "1117-classic-click.mp3": { start: 0, duration: 0.34, fadeOut: 0.08 },
  "1489-air-woosh.mp3": { start: 0.2, duration: 0.9, fadeOut: 0.28 },
  "2299-short-bass-hit.mp3": { start: 0.05, duration: 0.65, fadeOut: 0.3 },
};
const sfxTreatments = {
  "1474-transition-windy-swoosh.mp3": "highpass=f=150,lowpass=f=4800,acompressor=threshold=-32dB:ratio=2:attack=18:release=140",
  "3124-modern-technology-select.mp3": "highpass=f=220,lowpass=f=4200,acompressor=threshold=-34dB:ratio=2:attack=10:release=90",
  "3120-technology-transition-slide.mp3": "highpass=f=140,lowpass=f=5000,acompressor=threshold=-30dB:ratio=2:attack=18:release=120",
  "2578-opening-software-interface.mp3": "highpass=f=150,lowpass=f=5200,acompressor=threshold=-30dB:ratio=2:attack=18:release=120",
  "1386-keyboard.mp3": "highpass=f=180,lowpass=f=5400,acompressor=threshold=-30dB:ratio=2:attack=15:release=100",
  "2997-clear-mouse-clicks.mp3": "highpass=f=180,lowpass=f=5000,acompressor=threshold=-30dB:ratio=2:attack=10:release=90",
  "2577-interface-device-click.mp3": "highpass=f=180,lowpass=f=4800,acompressor=threshold=-30dB:ratio=2:attack=10:release=90",
  "1113-mouse-click-close.mp3": "highpass=f=180,lowpass=f=5000,acompressor=threshold=-30dB:ratio=2:attack=10:release=90",
  "1109-select-click.mp3": "highpass=f=180,lowpass=f=4800,acompressor=threshold=-30dB:ratio=2:attack=10:release=90",
  "2585-light-switch-tap.mp3": "highpass=f=180,lowpass=f=4500,acompressor=threshold=-30dB:ratio=2:attack=10:release=90",
  "1117-classic-click.mp3": "highpass=f=180,lowpass=f=4800,acompressor=threshold=-30dB:ratio=2:attack=8:release=80",
  "1489-air-woosh.mp3": "highpass=f=110,lowpass=f=4200,acompressor=threshold=-32dB:ratio=2:attack=18:release=160",
  "2299-short-bass-hit.mp3": "highpass=f=55,lowpass=f=180,acompressor=threshold=-28dB:ratio=2:attack=16:release=180",
};

const inputs = ["-y", "-i", videoPath];
for (const track of manifest.tracks) {
  inputs.push("-i", path.resolve(path.dirname(manifestPath), track.src));
}
for (const [file] of sfxEvents) inputs.push("-i", path.join(sfxRoot, file));

const filters = [];
const narrationLabels = [];
for (let index = 0; index < manifest.tracks.length; index += 1) {
  const track = manifest.tracks[index];
  const label = `n${index}`;
  filters.push(
    `[${index + 1}:a]aresample=48000,adelay=${track.offsetMs}|${track.offsetMs},volume=1.25[${label}]`,
  );
  narrationLabels.push(`[${label}]`);
}
filters.push(
  `${narrationLabels.join("")}amix=inputs=${narrationLabels.length}:duration=longest:dropout_transition=0[narrraw]`,
);
filters.push(
  `[narrraw]aformat=sample_rates=48000:channel_layouts=stereo[narr]`,
);
const sfxLabels = [];
for (let index = 0; index < sfxEvents.length; index += 1) {
  const [file, offsetMs, volume] = sfxEvents[index];
  const profile = sfxProfiles[file];
  const treatment = sfxTreatments[file];
  const label = `s${index}`;
  const inputIndex = manifest.tracks.length + 1 + index;
  filters.push(
    `[${inputIndex}:a]atrim=start=${profile.start}:duration=${profile.duration},asetpts=PTS-STARTPTS,aresample=48000,${treatment},volume=${volume * sfxEvents.length * sfxBusGain},afade=t=in:st=0:d=0.018,afade=t=out:st=${profile.duration - profile.fadeOut}:d=${profile.fadeOut},adelay=${offsetMs}|${offsetMs}[${label}]`,
  );
  sfxLabels.push(`[${label}]`);
}
filters.push(
  `${sfxLabels.join("")}amix=inputs=${sfxLabels.length}:duration=longest:dropout_transition=0[sfxraw]`,
);
filters.push(`[sfxraw]alimiter=limit=0.8[sfx]`);
filters.push(
  `[narr][sfx]amix=inputs=2:duration=longest:dropout_transition=0[narrsfx]`,
);
filters.push(
  `[narrsfx]loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${duration}[aout]`,
);

const result = spawnSync(
  "ffmpeg",
  [
    ...inputs,
    "-filter_complex",
    filters.join(";"),
    "-map",
    "0:v:0",
    "-map",
    "[aout]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    "-t",
    String(duration),
    outputPath,
  ],
  { stdio: "inherit", windowsHide: true },
);

if (result.status !== 0) {
  throw new Error(`ffmpeg exited with ${result.status ?? 1}`);
}
console.log(outputPath);
