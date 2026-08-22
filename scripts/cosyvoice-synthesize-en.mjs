#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index]?.replace(/^--/, ""), process.argv[index + 1]);
}

const manifestPath = path.resolve(args.get("manifest") ?? "");
const outDir = path.resolve(args.get("outDir") ?? "");
const baseUrl = String(args.get("baseUrl") ?? "").replace(/\/$/, "");
const promptWav = path.resolve(args.get("promptWav") ?? "");
const sampleRate = 22050;
const authoredStarts = args.get("starts")
  ? JSON.parse(fs.readFileSync(path.resolve(args.get("starts")), "utf8"))
  : {};
const forceIds = new Set(
  String(args.get("forceIds") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

if (!fs.existsSync(manifestPath) || !fs.existsSync(promptWav) || !baseUrl) {
  throw new Error("Required: --manifest, --outDir, --baseUrl, --promptWav");
}

function wavFromPcm(pcm) {
  const wav = Buffer.alloc(44 + pcm.length);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + pcm.length, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(pcm.length, 40);
  pcm.copy(wav, 44);
  return wav;
}

const source = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const narrationDir = path.join(outDir, "narration");
fs.mkdirSync(narrationDir, { recursive: true });

const resolved = [];
const tracks = [];
let cursorMs = 0;

for (let index = 0; index < source.narration.length; index += 1) {
  const cue = source.narration[index];
  const filename = `${String(index + 1).padStart(3, "0")}-${cue.id}.wav`;
  const output = path.join(narrationDir, filename);
  if (!fs.existsSync(output) || forceIds.has(cue.id)) {
    const form = new FormData();
    form.append("tts_text", `<|en|>${cue.text}`);
    form.append(
      "prompt_wav",
      new Blob([fs.readFileSync(promptWav)], { type: "audio/wav" }),
      path.basename(promptWav),
    );
    const response = await fetch(`${baseUrl}/inference_cross_lingual`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      throw new Error(`${cue.id}: ${response.status} ${response.statusText}`);
    }
    const pcm = Buffer.from(await response.arrayBuffer());
    if (pcm.length === 0) throw new Error(`${cue.id}: empty response`);
    fs.writeFileSync(output, wavFromPcm(pcm));
  }

  const wavBytes = fs.statSync(output).size - 44;
  const durationMs = Math.round((wavBytes / 2 / sampleRate) * 1000);
  const authoredStartFrame = authoredStarts[cue.id];
  const startMs =
    typeof authoredStartFrame === "number"
      ? Math.round((authoredStartFrame / source.fps) * 1000)
      : cursorMs;
  const endMs = startMs + durationMs;
  cursorMs = Math.max(cursorMs, endMs + 250);
  resolved.push({
    ...cue,
    text: `<|en|>${cue.text}`,
    startMs,
    endMs,
    startFrame: Math.round((startMs / 1000) * source.fps),
    endFrame: Math.round((endMs / 1000) * source.fps),
  });
  tracks.push({
    id: cue.id,
    src: `./narration/${filename}`,
    kind: "narration",
    volume: 1.8,
    offsetMs: startMs,
  });
  console.log(`${cue.id}: ${(durationMs / 1000).toFixed(2)}s`);
}

const result = {
  ...source,
  duration: Math.max(
    source.duration,
    Math.ceil((cursorMs / 1000) * source.fps),
  ),
  narration: resolved,
  tracks,
  lockToAudio: true,
};
fs.writeFileSync(
  path.join(outDir, "audio-manifest.resolved.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(`Resolved duration: ${(cursorMs / 1000).toFixed(2)}s`);
