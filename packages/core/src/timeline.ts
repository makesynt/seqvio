/**
 * Seqvio Timeline Engine
 *
 * 统一时间轴引擎 - 提供帧精确的时间控制和动画插值
 */

import { runtimeGlobalName } from './brand';

export interface TimelineConfig {
  fps: number;
  duration: number;  // 总帧数
  autoPlay?: boolean;
}

export interface InterpolateOptions {
  easing?: EasingFunction | string;
  extrapolateLeft?: 'clamp' | 'extend' | 'identity';
  extrapolateRight?: 'clamp' | 'extend' | 'identity';
}

export interface SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
}

export interface KeyframeOptions {
  easing?: EasingFunction | string;
}

export type EasingFunction = (t: number) => number;

export type TimelineEvent =
  | 'frame-change'
  | 'scene-enter'
  | 'scene-exit'
  | 'composition-ready'
  | 'composition-complete'
  | 'render-start'
  | 'render-complete';

export type EventHandler = (...args: any[]) => void;

function resolveEasingFunction(easing: EasingFunction | string): EasingFunction {
  if (typeof easing === 'function') {
    return easing;
  }

  if (easing === 'bezier') {
    return Easings.linear;
  }

  const candidate = Easings[easing as Exclude<keyof typeof Easings, 'bezier'>];
  return typeof candidate === 'function' ? candidate : Easings.linear;
}

/**
 * 预定义缓动函数
 */
export const Easings = {
  linear: (t: number) => t,

  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // 三次贝塞尔曲线（CSS cubic-bezier 兼容）
  bezier: (x1: number, y1: number, x2: number, y2: number) => {
    return (t: number) => {
      // 简化版实现，生产环境应使用完整的贝塞尔求解器
      const t2 = t * t;
      const t3 = t2 * t;
      return (
        3 * (1 - t) * (1 - t) * t * y1 +
        3 * (1 - t) * t2 * y2 +
        t3
      );
    };
  },

  // 弹性缓动
  elastic: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },

  // 弹跳缓动
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};

/**
 * 核心时间轴引擎类
 */
export class TimelineEngine {
  private currentFrame: number = 0;
  private config: Required<TimelineConfig>;
  private listeners: Map<TimelineEvent, Set<EventHandler>> = new Map();
  private isPlaying: boolean = false;

  // 缓存系统 - 避免重复计算
  private interpolationCache: Map<string, number> = new Map();
  private springCache: Map<string, number> = new Map();

  constructor(config: TimelineConfig) {
    this.config = {
      fps: config.fps,
      duration: config.duration,
      autoPlay: config.autoPlay ?? false,
    };

    if (this.config.autoPlay) {
      this.play();
    }
  }

  /**
   * 获取当前帧号
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * 获取当前时间（秒）
   */
  getCurrentTime(): number {
    return this.currentFrame / this.config.fps;
  }

  /**
   * 跳转到指定帧
   */
  seekToFrame(frame: number): void {
    const oldFrame = this.currentFrame;
    this.currentFrame = Math.max(0, Math.min(frame, this.config.duration - 1));

    if (oldFrame !== this.currentFrame) {
      this.clearCache();
      this.emit('frame-change', this.currentFrame);
    }
  }

  /**
   * 跳转到指定时间（秒）
   */
  seekToTime(seconds: number): void {
    const frame = Math.round(seconds * this.config.fps);
    this.seekToFrame(frame);
  }

  /**
   * 播放
   */
  play(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.tick();
  }

  /**
   * 暂停
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * 停止并重置
   */
  stop(): void {
    this.pause();
    this.seekToFrame(0);
  }

  /**
   * 帧循环
   */
  private tick(): void {
    if (!this.isPlaying) return;

    this.seekToFrame(this.currentFrame + 1);

    if (this.currentFrame >= this.config.duration - 1) {
      this.pause();
      this.emit('composition-complete');
    } else {
      requestAnimationFrame(() => this.tick());
    }
  }

  /**
   * 线性插值
   *
   * @example
   * const opacity = timeline.interpolate([0, 1], { start: 0, duration: 60 });
   */
  interpolate(
    output: [number, number],
    options: {
      start: number;
      duration: number;
      easing?: EasingFunction | string;
      extrapolateLeft?: 'clamp' | 'extend';
      extrapolateRight?: 'clamp' | 'extend';
    }
  ): number {
    const { start, duration, easing = 'linear' } = options;
    const end = start + duration;

    // 生成缓存 key
    const cacheKey = `${this.currentFrame}:${start}:${end}:${output[0]}:${output[1]}`;
    if (this.interpolationCache.has(cacheKey)) {
      return this.interpolationCache.get(cacheKey)!;
    }

    // 计算进度 (0-1)
    let progress = (this.currentFrame - start) / duration;

    // 外推处理
    if (progress < 0) {
      progress = options.extrapolateLeft === 'extend' ? progress : 0;
    } else if (progress > 1) {
      progress = options.extrapolateRight === 'extend' ? progress : 1;
    }

    // 应用缓动
    const easingFunc = resolveEasingFunction(easing);
    const easedProgress = easingFunc(progress);

    // 插值计算
    const result = output[0] + (output[1] - output[0]) * easedProgress;

    // 缓存结果
    this.interpolationCache.set(cacheKey, result);

    return result;
  }

  /**
   * 物理弹簧动画
   *
   * @example
   * const scale = timeline.spring(1.5, { stiffness: 100, damping: 10 });
   */
  spring(
    target: number,
    options: SpringOptions = {}
  ): number {
    const {
      stiffness = 170,
      damping = 26,
      mass = 1,
      velocity = 0,
    } = options;

    const cacheKey = `${this.currentFrame}:${target}:${stiffness}:${damping}`;
    if (this.springCache.has(cacheKey)) {
      return this.springCache.get(cacheKey)!;
    }

    const time = this.getCurrentTime();

    // 弹簧动力学方程
    const angularFreq = Math.sqrt(stiffness / mass);
    const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));

    let result: number;

    if (dampingRatio < 1) {
      // 欠阻尼（有振荡）
      const dampedFreq = angularFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
      const envelope = Math.exp(-dampingRatio * angularFreq * time);
      result = target * (1 - envelope * (
        Math.cos(dampedFreq * time) +
        (dampingRatio * angularFreq / dampedFreq) * Math.sin(dampedFreq * time)
      ));
    } else if (dampingRatio === 1) {
      // 临界阻尼
      const envelope = Math.exp(-angularFreq * time);
      result = target * (1 - envelope * (1 + angularFreq * time));
    } else {
      // 过阻尼（无振荡）
      const r1 = -angularFreq * (dampingRatio + Math.sqrt(dampingRatio * dampingRatio - 1));
      const r2 = -angularFreq * (dampingRatio - Math.sqrt(dampingRatio * dampingRatio - 1));
      result = target * (1 - (
        (r2 * Math.exp(r1 * time) - r1 * Math.exp(r2 * time)) / (r2 - r1)
      ));
    }

    this.springCache.set(cacheKey, result);
    return result;
  }

  /**
   * 关键帧动画
   *
   * @example
   * const position = timeline.keyframes({
   *   0: { x: 0, y: 0 },
   *   30: { x: 100, y: 50 },
   *   60: { x: 200, y: 0 }
   * });
   */
  keyframes<T extends Record<string, any>>(
    frames: Record<number, T>,
    options: KeyframeOptions = {}
  ): T {
    const frameNumbers = Object.keys(frames)
      .map(Number)
      .sort((a, b) => a - b);

    // 找到当前帧所在的区间
    let startFrame = frameNumbers[0];
    let endFrame = frameNumbers[frameNumbers.length - 1];

    for (let i = 0; i < frameNumbers.length - 1; i++) {
      if (
        this.currentFrame >= frameNumbers[i] &&
        this.currentFrame <= frameNumbers[i + 1]
      ) {
        startFrame = frameNumbers[i];
        endFrame = frameNumbers[i + 1];
        break;
      }
    }

    const startValue = frames[startFrame];
    const endValue = frames[endFrame];

    // 计算插值
    const progress = (this.currentFrame - startFrame) / (endFrame - startFrame);
    const easingFunc = options.easing
      ? resolveEasingFunction(options.easing)
      : Easings.linear;
    const easedProgress = easingFunc(progress);

    // 对每个属性进行插值
    const result: any = {};
    for (const key in startValue) {
      if (typeof startValue[key] === 'number' && typeof endValue[key] === 'number') {
        result[key] = startValue[key] + (endValue[key] - startValue[key]) * easedProgress;
      } else {
        result[key] = easedProgress < 0.5 ? startValue[key] : endValue[key];
      }
    }

    return result as T;
  }

  /**
   * 注册事件监听器
   */
  on(event: TimelineEvent, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * 移除事件监听器
   */
  off(event: TimelineEvent, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 触发事件
   */
  private emit(event: TimelineEvent, ...args: any[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  /**
   * 清除缓存
   */
  private clearCache(): void {
    this.interpolationCache.clear();
    this.springCache.clear();
  }

  /**
   * 销毁时间轴
   */
  dispose(): void {
    this.pause();
    this.listeners.clear();
    this.clearCache();
  }
}

/**
 * React Hook - useFrame
 *
 * @example
 * const frame = useFrame();
 * const opacity = interpolate(frame, [0, 60], [0, 1]);
 */
export function useFrame(): number {
  if (typeof window === 'undefined') return 0;

  const runtimeTimeline = runtimeGlobalName('timeline') as '__seqvio_timeline';
  const timeline = window[runtimeTimeline] as TimelineEngine;
  return timeline ? timeline.getCurrentFrame() : 0;
}

/**
 * React Hook - useTimeline
 *
 * @example
 * const tl = useTimeline();
 * const opacity = tl.interpolate([0, 1], { start: 0, duration: 60 });
 */
export function useTimeline(): TimelineEngine {
  if (typeof window === 'undefined') {
    throw new Error('useTimeline can only be used in browser environment');
  }

  const runtimeTimeline = runtimeGlobalName('timeline') as '__seqvio_timeline';
  const timeline = window[runtimeTimeline] as TimelineEngine;
  if (!timeline) {
    throw new Error('Timeline not initialized');
  }

  return timeline;
}

declare global {
  interface Window {
    __seqvio_timeline?: TimelineEngine;
  }
}
