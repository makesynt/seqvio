/**
 * @internal TransportClock is not wired to any user-facing surface as of Phase 0
 * (no external importers; preview-cli does not use it). Retained as a seed for
 * the low-priority Phase 5 preview minimum. Marked internal so it is not
 * mistaken for a released capability.
 */
export type TransportClockSource = 'monotonic' | 'audio';

export interface TransportClockSnapshot {
  time: number;
  playing: boolean;
  rate: number;
  duration: number;
  source: TransportClockSource;
}

export type AudioClockSource =
  | { el: HTMLMediaElement; compositionStart: number; mediaStart: number }
  | { currentTimeSeconds: number };

export interface TransportClockOptions {
  initialTime?: number;
  rate?: number;
  duration?: number;
  nowMs?: () => number;
}

export class TransportClock {
  private _baseTime: number;
  private _playStartMs: number | null = null;
  private _rate: number;
  private _duration: number;
  private _nowMs: () => number;
  private _audioSource: AudioClockSource | null = null;

  constructor(opts?: TransportClockOptions) {
    this._baseTime = opts?.initialTime ?? 0;
    this._rate = opts?.rate ?? 1;
    this._duration = opts?.duration ?? Infinity;
    this._nowMs = opts?.nowMs ?? (() => performance.now());
  }

  now(): number {
    if (this._playStartMs === null) return this._baseTime;

    if (this._audioSource) {
      const t = this._deriveAudioTime();
      if (t !== null) return Math.min(Math.max(0, t), this._duration);
    }

    const elapsedMs = this._nowMs() - this._playStartMs;
    const t = this._baseTime + (elapsedMs / 1000) * this._rate;
    return Math.min(Math.max(0, t), this._duration);
  }

  play(): boolean {
    if (this._playStartMs !== null) return false;
    if (this._baseTime >= this._duration) return false;
    this._playStartMs = this._nowMs();
    return true;
  }

  pause(): boolean {
    if (this._playStartMs === null) return false;
    this._baseTime = this.now();
    this._playStartMs = null;
    return true;
  }

  seek(timeSeconds: number): void {
    const clamped = Math.min(Math.max(0, timeSeconds), this._duration);
    this._baseTime = clamped;
    if (this._playStartMs !== null) {
      this._playStartMs = this._nowMs();
    }
  }

  isPlaying(): boolean {
    return this._playStartMs !== null;
  }

  setRate(rate: number): void {
    const clamped = Math.min(Math.max(0.1, rate), 5);
    if (this._playStartMs !== null) {
      this._baseTime = this.now();
      this._playStartMs = this._nowMs();
    }
    this._rate = clamped;
  }

  getRate(): number {
    return this._rate;
  }

  setDuration(duration: number): void {
    this._duration = Math.max(0, duration);
    if (this._baseTime > this._duration) {
      this._baseTime = this._duration;
    }
  }

  getDuration(): number {
    return this._duration;
  }

  attachAudioSource(source: AudioClockSource): void {
    this._audioSource = source;
  }

  detachAudioSource(): void {
    if (this._audioSource && this._playStartMs !== null) {
      this._baseTime = this.now();
      this._playStartMs = this._nowMs();
    }
    this._audioSource = null;
  }

  hasAudioSource(): boolean {
    return this._audioSource !== null;
  }

  getSource(): TransportClockSource {
    return this._audioSource ? 'audio' : 'monotonic';
  }

  snapshot(): TransportClockSnapshot {
    return {
      time: this.now(),
      playing: this.isPlaying(),
      rate: this._rate,
      duration: this._duration,
      source: this.getSource(),
    };
  }

  reachedEnd(): boolean {
    return this.now() >= this._duration;
  }

  private _deriveAudioTime(): number | null {
    const src = this._audioSource;
    if (!src) return null;

    if ('currentTimeSeconds' in src) {
      return src.currentTimeSeconds;
    }

    const { el, compositionStart, mediaStart } = src;
    if (!el || typeof el.currentTime !== 'number') return null;
    const mediaTime = el.currentTime - mediaStart;
    if (mediaTime < 0) return null;
    const playbackRate = el.playbackRate || 1;
    return (mediaTime / playbackRate) * this._rate + compositionStart;
  }
}
