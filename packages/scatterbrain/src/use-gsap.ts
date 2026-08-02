import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  registerSeekable,
  unregisterSeekable,
  useSceneFrameMapper,
  type SeekableAdapter,
} from '@seqvio/core';

const DEFAULT_FPS = 30;

/**
 * 创建一个把 GSAP timeline 接入 Seqvio 渲染时钟的 adapter。
 *
 * 关键点：`flushSeekables` 用**全局合成帧**驱动每个 adapter，但场景组件的
 * `start`/`duration` 都是**场景局部**时间（与 useCurrentFrame 一致）。因此
 * seek 时必须减去所在 <Scene> 的全局起点 globalStart，得到场景局部秒数，
 * 否则多场景合成里场景 2/3 的动画会被 seek 到远超其位置而直接跳到终态。
 */
function gsapSceneSeekable(
  tl: gsap.core.Timeline,
  id: string,
  mapFrame: (frame: number) => number,
  fps: number,
): SeekableAdapter {
  return {
    id,
    seek(_timeSeconds: number, frame: number) {
      tl.seek(mapFrame(frame) / fps);
    },
    requiresRaf: false,
  };
}

export function useGsapReveal(
  id: string,
  ref: React.RefObject<HTMLElement | null>,
  vars: gsap.TweenVars,
  startFrame: number,
  durationFrames: number,
  fps: number = DEFAULT_FPS,
): void {
  const mapFrame = useSceneFrameMapper();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tl = gsap.timeline({ paused: true });
    tl.to(
      el,
      {
        ...vars,
        duration: durationFrames / fps,
      },
      startFrame / fps,
    );
    const adapter = gsapSceneSeekable(tl, id, mapFrame, fps);
    registerSeekable(adapter);
    return () => {
      unregisterSeekable(id);
      tl.kill();
    };
  }, [id, startFrame, durationFrames, fps, mapFrame]);
}

export function useGsapTimeline(
  id: string,
  build: (tl: gsap.core.Timeline) => void,
  deps: unknown[],
  fps: number = DEFAULT_FPS,
): void {
  const buildRef = useRef(build);
  buildRef.current = build;
  const mapFrame = useSceneFrameMapper();

  useLayoutEffect(() => {
    const tl = gsap.timeline({ paused: true });
    buildRef.current(tl);
    const adapter = gsapSceneSeekable(tl, id, mapFrame, fps);
    registerSeekable(adapter);
    return () => {
      unregisterSeekable(id);
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mapFrame, fps, ...deps]);
}
