import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export interface VolumeKeyframe {
  time: number;
  volume: number;
}

export function normaliseEnvelope(
  keyframes: VolumeKeyframe[],
  trackStart: number,
  baseVolume: number
): VolumeKeyframe[] {
  if (keyframes.length === 0) return [{ time: 0, volume: baseVolume }];

  const relative = keyframes
    .map((kf) => ({
      time: Math.max(0, kf.time - trackStart),
      volume: Math.min(1, Math.max(0, kf.volume)),
    }))
    .sort((a, b) => a.time - b.time);

  const deduped: VolumeKeyframe[] = [];
  for (const kf of relative) {
    const last = deduped[deduped.length - 1];
    if (last && Math.abs(last.time - kf.time) < 0.001) {
      last.volume = kf.volume;
    } else {
      deduped.push({ ...kf });
    }
  }

  if (deduped[0].time > 0) {
    deduped.unshift({ time: 0, volume: baseVolume });
  }

  return deduped;
}

export function interpolateVolumeGain(envelope: VolumeKeyframe[], t: number): number {
  if (envelope.length === 0) return 1;
  if (t <= envelope[0].time) return envelope[0].volume;
  const last = envelope[envelope.length - 1];
  if (t >= last.time) return last.volume;

  for (let i = 0; i < envelope.length - 1; i++) {
    const a = envelope[i];
    const b = envelope[i + 1];
    if (t >= a.time && t <= b.time) {
      const span = b.time - a.time;
      if (span <= 0) return b.volume;
      const frac = (t - a.time) / span;
      return a.volume + (b.volume - a.volume) * frac;
    }
  }
  return last.volume;
}

export function applyVolumeEnvelopeToWav(
  wavPath: string,
  keyframes: VolumeKeyframe[],
  trackStart: number,
  baseVolume: number
): boolean {
  const envelope = normaliseEnvelope(keyframes, trackStart, baseVolume);

  let buf: Buffer;
  try {
    buf = fs.readFileSync(wavPath);
  } catch {
    return false;
  }

  if (buf.length < 44) return false;
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return false;
  if (buf.toString('ascii', 8, 12) !== 'WAVE') return false;

  let dataOffset = -1;
  let dataSize = 0;
  let bitsPerSample = 0;
  let numChannels = 0;
  let sampleRate = 0;

  let pos = 12;
  while (pos + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', pos, pos + 4);
    const chunkSize = buf.readUInt32LE(pos + 4);

    if (chunkId === 'fmt ') {
      const audioFormat = buf.readUInt16LE(pos + 8);
      if (audioFormat !== 1) return false; // not PCM
      numChannels = buf.readUInt16LE(pos + 10);
      sampleRate = buf.readUInt32LE(pos + 12);
      bitsPerSample = buf.readUInt16LE(pos + 22);
      if (bitsPerSample !== 16) return false;
    } else if (chunkId === 'data') {
      dataOffset = pos + 8;
      dataSize = chunkSize;
    }
    pos += 8 + chunkSize + (chunkSize % 2);
  }

  if (dataOffset < 0 || numChannels === 0 || sampleRate === 0) return false;

  const bytesPerSample = 2;
  const frameSize = bytesPerSample * numChannels;
  const totalFrames = Math.floor(dataSize / frameSize);

  let segIdx = 0;
  for (let i = 0; i < totalFrames; i++) {
    const t = i / sampleRate;

    while (segIdx < envelope.length - 2 && t > envelope[segIdx + 1].time) {
      segIdx++;
    }

    const a = envelope[segIdx];
    const b = envelope[Math.min(segIdx + 1, envelope.length - 1)];
    let gain: number;
    if (b.time <= a.time) {
      gain = b.volume;
    } else {
      const frac = Math.min(1, Math.max(0, (t - a.time) / (b.time - a.time)));
      gain = a.volume + (b.volume - a.volume) * frac;
    }

    const sampleOffset = dataOffset + i * frameSize;
    for (let ch = 0; ch < numChannels; ch++) {
      const bytePos = sampleOffset + ch * bytesPerSample;
      if (bytePos + 1 >= buf.length) break;
      const sample = buf.readInt16LE(bytePos);
      const scaled = Math.round(sample * gain);
      buf.writeInt16LE(Math.max(-32768, Math.min(32767, scaled)), bytePos);
    }
  }

  const tmpName = `${wavPath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(tmpName, buf);
    fs.renameSync(tmpName, wavPath);
  } catch {
    try { fs.unlinkSync(tmpName); } catch { /* ignore */ }
    return false;
  }

  return true;
}

export function buildVolumeExpression(
  keyframes: VolumeKeyframe[],
  trackStart: number
): string {
  const envelope = normaliseEnvelope(keyframes, trackStart, 1);
  if (envelope.length <= 1) return `volume=${envelope[0]?.volume ?? 1}`;

  let expr = `${envelope[envelope.length - 1].volume}`;
  for (let i = envelope.length - 2; i >= 0; i--) {
    const a = envelope[i];
    const b = envelope[i + 1];
    const slope = b.time > a.time ? (b.volume - a.volume) / (b.time - a.time) : 0;
    const linearExpr = `(${a.volume}+${slope.toFixed(6)}*(t-${a.time.toFixed(4)}))`;
    expr = `if(lt(t\\,${b.time.toFixed(4)})\\,${linearExpr}\\,${expr})`;
  }

  return `volume=${expr}:eval=frame`;
}
