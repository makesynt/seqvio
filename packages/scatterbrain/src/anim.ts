/**
 * 帧驱动动画助手 —— scatterbrain 风格组件共用。
 *
 * 仅依赖 @seqvio/core 的帧状态：style package 只需要 core，不碰 whiteboard、
 * 不碰 renderer。这与被验证过的 @seqvio/presentation 解耦模式完全一致。
 */

import { useCurrentFrame } from '@seqvio/core';

export type Easing =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'back-out';   // 轻微回弹 —— 便签"啪"地贴上去的手感

const easingFns: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  // back-out：终值附近轻微过冲再回落，模拟便签被按上墙的弹性
  'back-out': (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/** 给定起始帧 start、时长 duration，返回缓动后的 0..1 进度。 */
export function useReveal(
  start: number,
  duration: number,
  easing: Easing = 'ease-out'
): number {
  const frame = useCurrentFrame();
  if (duration <= 0) return frame >= start ? 1 : 0;
  const raw = Math.max(0, Math.min(1, (frame - start) / duration));
  return easingFns[easing](raw);
}
