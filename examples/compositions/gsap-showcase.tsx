/**
 * GSAP 新组件演示 —— TextReveal / ElasticNote / MotionFly
 *
 * 展示接入 GSAP 后新增的三个 style 组件，这些都是手写 easing 做不到的效果：
 *   1. TextReveal  (scatterbrain)  — 逐字弹入，GSAP stagger 编排
 *   2. ElasticNote (scatterbrain)  — elastic 回弹落定 + boxShadow 补间
 *   3. MotionFly   (product-demo)  — 沿 SVG 曲线飞入（MotionPathPlugin）
 *
 * 三个组件都走 useGsapTimeline → registerSeekable 路径，paused timeline
 * 逐帧 seek，渲染输出完全确定。
 */

import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene, Transition } from '@seqvio/core';
import {
  ScatterScene,
  TextReveal,
  ElasticNote,
  Doodle,
  Scrawl,
  palette,
  typeScale,
} from '@seqvio/scatterbrain';
import {
  ProductDemoScene,
  MotionFly,
  BrowserFrame,
  ProductTitle,
  productPalette,
} from '@seqvio/product-demo';

const W = 1280;
const H = 720;
const FPS = 30;

const TS = typeScale;

// ─── 场景 1：逐字弹入（纸）────────────────────────────────────────────────────
function TextRevealScene() {
  return (
    <ScatterScene surface="paper">
      <TextReveal
        text="逐字弹入"
        position={{ x: 120, y: 180 }}
        fontSize={140}
        rotate={-2}
        start={15}
        duration={16}
        stagger={4}
      />
      <Doodle
        type="underline"
        position={{ x: 130, y: 340 }}
        size={300}
        color={palette.pinRed}
        start={55}
        duration={18}
      />
      <TextReveal
        text="GSAP stagger 让文字活起来"
        position={{ x: 130, y: 420 }}
        fontSize={TS.h2}
        hand={false}
        rotate={-1}
        start={70}
        duration={12}
        stagger={2}
      />
      <Scrawl
        text="每个字符独立回弹，像打字机一样浮现"
        position={{ x: 130, y: 520 }}
        fontSize={TS.body}
        hand={false}
        color={palette.inkLight}
        start={120}
        duration={16}
      />
    </ScatterScene>
  );
}

// ─── 场景 2：弹性便签（软木板）────────────────────────────────────────────────
function ElasticNoteScene() {
  return (
    <ScatterScene surface="cork">
      <Scrawl
        text="弹性便签"
        position={{ x: 90, y: 60 }}
        fontSize={TS.h1}
        color="#fff8e7"
        rotate={-2}
        start={0}
        duration={20}
      />
      <ElasticNote
        title="elastic 缓动"
        position={{ x: 90, y: 230 }}
        width={330}
        color="yellow"
        rotate={-3}
        start={20}
        duration={26}
      >
        比 back-out 回弹更多次，更活泼
      </ElasticNote>
      <ElasticNote
        title="投影收紧"
        position={{ x: 480, y: 270 }}
        width={330}
        color="blue"
        rotate={2}
        start={55}
        duration={26}
      >
        落定瞬间 boxShadow 由虚到实
      </ElasticNote>
      <ElasticNote
        title="回弹落定"
        position={{ x: 870, y: 230 }}
        width={330}
        color="pink"
        rotate={-2}
        start={90}
        duration={26}
      >
        像被一只手按上软木板
      </ElasticNote>
      <Doodle
        type="squiggle"
        position={{ x: 950, y: 80 }}
        size={180}
        color="#fff8e7"
        rotate={8}
        start={120}
        duration={24}
        opacity={0.5}
      />
    </ScatterScene>
  );
}

// ─── 场景 3：沿路径飞入（产品演示）────────────────────────────────────────────
function MotionFlyScene() {
  return (
    <ProductDemoScene>
      <ProductTitle
        title="沿路径飞入"
        subtitle="MotionPathPlugin 让元素沿曲线运动到目标位置"
        position={{ x: 70, y: 70 }}
        start={0}
      />
      <BrowserFrame
        position={{ x: 680, y: 190 }}
        width={500}
        height={380}
        url="app.seqvio.local/chart"
        title="Dashboard"
        start={15}
        duration={22}
      />
      {/* 徽章沿一条 S 形曲线飞到浏览器窗口中央 */}
      <MotionFly
        path="M 120,580 C 320,220 620,640 930,380"
        start={45}
        duration={55}
        fromScale={0.5}
        toScale={1}
        ease="power2.inOut"
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: productPalette.accent,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 800,
            boxShadow: `0 12px 32px ${productPalette.shadow}`,
          }}
        >
          ✓
        </div>
      </MotionFly>
    </ProductDemoScene>
  );
}

// ─── 视频组合 ─────────────────────────────────────────────────────────────────
export default function GsapShowcase() {
  return (
    <VideoComposition
      id="gsap-showcase"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor={palette.cream}
    >
      <Scene id="text" duration={170}><TextRevealScene /></Scene>
      <Transition type="fade" duration={10} />
      <Scene id="elastic" duration={170}><ElasticNoteScene /></Scene>
      <Transition type="fade" duration={10} />
      <Scene id="fly" duration={180}><MotionFlyScene /></Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 560,
  width: W,
  height: H,
};
