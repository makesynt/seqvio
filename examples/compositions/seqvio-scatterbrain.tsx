/**
 * Scatterbrain 风格演示 —— 便利贴 / 软木板 / 图钉 / 涂鸦
 *
 * 这是 @seqvio/scatterbrain 的演示，一个与 @seqvio/whiteboard 平行的 style
 * package。同一套 Scene/Transition 时间模型，但视觉是 div/CSS 的便签墙美学：
 * 旋转、渐变、柔和投影、图钉、胶带、手绘涂鸦 —— whiteboard 做不到的效果。
 *
 * 场景结构：
 *   1. Cover    (cork)  — 手写大标题 + 几张钉在软木板上的便签
 *   2. Workflow (paper) — 四步流程便签横排，箭头涂鸦连接
 *   3. Features (warm)  — 错位便签列 + 拍立得照片
 *   4. Closing  (cork)  — 大手写结语 + 命令便签
 */

import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene, Transition } from '@seqvio/core';
import {
  ScatterScene,
  StickyNote,
  Scrawl,
  PinnedList,
  Doodle,
  Polaroid,
  palette,
  typeScale,
} from '@seqvio/scatterbrain';

const W = 1280;
const H = 720;
const FPS = 30;

const TS = typeScale;

// ─── 场景 1：封面（软木板）────────────────────────────────────────────────────
function CoverScene() {
  return (
    <ScatterScene surface="cork">
      {/* 标签便签 */}
      <StickyNote position={{ x: 80, y: 70 }} width={210} color="orange"
        rotate={-4} attach="tape" start={0} duration={14}
        style={{ padding: '12px 20px' }}>
        <span style={{ fontSize: TS.caption }}>A FIELD BOARD · VOL.1</span>
      </StickyNote>

      {/* 主标题手写大字 */}
      <Scrawl text="Seqvio" position={{ x: 90, y: 200 }}
        fontSize={150} color="#fff8e7" rotate={-2} start={10} duration={26} />
      <Scrawl text="便签墙风格" position={{ x: 110, y: 360 }}
        fontSize={TS.h1} color="#fff8e7" rotate={-1} start={36} duration={22} />

      {/* 右侧几张钉着的便签 */}
      <StickyNote title="结构化内容" position={{ x: 820, y: 150 }} width={340}
        color="yellow" rotate={3} attach="pin" pinColor="red"
        start={50} duration={16}>
        把脚本、场景、旁白钉到一起
      </StickyNote>
      <StickyNote title="→ 说明视频" position={{ x: 850, y: 360 }} width={320}
        color="blue" rotate={-3} attach="pin" pinColor="gold"
        start={72} duration={16}>
        一次编写，可重复渲染
      </StickyNote>

      {/* 涂鸦 */}
      <Doodle type="circle" position={{ x: 760, y: 330 }} size={140}
        color="#fff8e7" rotate={-8} start={92} duration={24} opacity={0.6} />
      <Doodle type="arrow" position={{ x: 700, y: 250 }} size={120}
        color="#fff8e7" rotate={20} start={104} duration={20} opacity={0.6} />

      <Scrawl text="github.com/makesynt/seqvio" position={{ x: 90, y: 640 }}
        fontSize={TS.caption} color="rgba(255,248,231,0.7)" hand
        start={120} duration={14} />
    </ScatterScene>
  );
}

// ─── 场景 2：工作流程（纸）────────────────────────────────────────────────────
function WorkflowScene() {
  const steps = [
    { t: '内容', b: '脚本 · 素材 · 旁白', c: 'yellow' as const },
    { t: '场景', b: 'TSX · 组件即画面',   c: 'green' as const },
    { t: '旁白', b: '4 个 TTS 引擎',      c: 'pink' as const },
    { t: 'MP4',  b: 'seqvio-render',      c: 'blue' as const },
  ];
  const xs = [70, 380, 690, 1000];
  const ys = [220, 200, 230, 205];
  const rots = [-3, 2, -2, 3];

  return (
    <ScatterScene surface="paper">
      <Scrawl text="怎么做？" position={{ x: 70, y: 60 }} fontSize={TS.h1}
        rotate={-2} start={0} duration={20} />
      <Doodle type="underline" position={{ x: 70, y: 130 }} size={220}
        color={palette.pinRed} start={18} duration={18} />

      {steps.map((s, i) => (
        <React.Fragment key={s.t}>
          <StickyNote title={s.t} position={{ x: xs[i], y: ys[i] }} width={240}
            height={190} color={s.c} rotate={rots[i]}
            attach={i % 2 === 0 ? 'pin' : 'tape'}
            pinColor={(['red', 'blue', 'gold', 'green'] as const)[i]}
            start={28 + i * 22} duration={16}>
            {s.b}
          </StickyNote>
          {i < steps.length - 1 && (
            <Doodle type="arrow" position={{ x: xs[i] + 232, y: ys[i] + 60 }}
              size={80} color={palette.ink} rotate={i % 2 === 0 ? 8 : -8}
              start={40 + i * 22} duration={14} opacity={0.7} />
          )}
        </React.Fragment>
      ))}

      <Scrawl text="一条线串起来 —— 全程 TSX 驱动" position={{ x: 70, y: 470 }}
        fontSize={TS.body} hand={false} rotate={-1} start={130} duration={18} />
    </ScatterScene>
  );
}

// ─── 场景 3：特性（暖渐变）────────────────────────────────────────────────────
function FeaturesScene() {
  return (
    <ScatterScene surface="warm">
      <Scrawl text="带来什么" position={{ x: 70, y: 60 }} fontSize={TS.h1}
        rotate={-2} start={0} duration={20} />

      {/* 左侧错位便签列 */}
      <PinnedList
        items={[
          '旁白自动对齐场景',
          '所有素材存入 Git',
          '相同输入 → 相同视频',
        ]}
        position={{ x: 80, y: 200 }}
        itemWidth={420}
        start={20}
        stagger={16}
      />

      {/* 右侧拍立得 */}
      <Polaroid caption="便签墙 · 灵感板"
        position={{ x: 720, y: 170 }} width={300} rotate={4}
        fill="linear-gradient(135deg, #ffe066, #74c0fc)"
        start={40} duration={18}>
        <span style={{ fontFamily: '"Caveat", cursive', fontSize: 60, color: palette.ink }}>
          ✦ idea
        </span>
      </Polaroid>
      <Polaroid caption="可复现 · 可编辑"
        position={{ x: 880, y: 400 }} width={260} rotate={-5}
        fill="linear-gradient(135deg, #b2f2bb, #ffc9c9)"
        start={64} duration={18}>
        <span style={{ fontFamily: '"Caveat", cursive', fontSize: 52, color: palette.ink }}>
          ♺ repro
        </span>
      </Polaroid>

      <Doodle type="star" position={{ x: 660, y: 120 }} size={70}
        color={palette.pinRed} rotate={10} start={90} duration={18} />
    </ScatterScene>
  );
}

// ─── 场景 4：结语（软木板）────────────────────────────────────────────────────
function ClosingScene() {
  return (
    <ScatterScene surface="cork">
      <Scrawl text="开始动手" position={{ x: 90, y: 130 }} fontSize={120}
        color="#fff8e7" rotate={-2} start={0} duration={24} />

      {/* 命令便签（白便签，等宽感） */}
      <StickyNote position={{ x: 90, y: 330 }} width={760} color="yellow"
        rotate={1} attach="tape" start={24} duration={18}
        fontSize={TS.caption}>
        <span style={{ fontFamily: 'monospace', fontSize: 22 }}>
          node packages/renderer/dist/cli.js
          <br />
          &nbsp;&nbsp;--component scene.tsx --output out.mp4
        </span>
      </StickyNote>

      {/* 三张结语小便签 */}
      <StickyNote title="可复现" position={{ x: 90, y: 500 }} width={220}
        color="green" rotate={-3} attach="pin" pinColor="green"
        start={50} duration={14} style={{ padding: '16px 20px' }}>
        <span style={{ fontSize: TS.caption }}>每次都一样</span>
      </StickyNote>
      <StickyNote title="可编辑" position={{ x: 360, y: 510 }} width={220}
        color="pink" rotate={2} attach="pin" pinColor="red"
        start={64} duration={14} style={{ padding: '16px 20px' }}>
        <span style={{ fontSize: TS.caption }}>存进版本库</span>
      </StickyNote>
      <StickyNote title="AI 友好" position={{ x: 630, y: 500 }} width={220}
        color="blue" rotate={-2} attach="pin" pinColor="blue"
        start={78} duration={14} style={{ padding: '16px 20px' }}>
        <span style={{ fontSize: TS.caption }}>结构化数据</span>
      </StickyNote>

      <Doodle type="squiggle" position={{ x: 900, y: 200 }} size={200}
        color="#fff8e7" rotate={6} start={96} duration={26} opacity={0.5} />

      <Scrawl text="github.com/makesynt/seqvio" position={{ x: 900, y: 640 }}
        fontSize={TS.caption} color="rgba(255,248,231,0.75)" hand
        start={110} duration={14} />
    </ScatterScene>
  );
}

// ─── 视频组合 ─────────────────────────────────────────────────────────────────
export default function SeqvioScatterbrain() {
  return (
    <VideoComposition
      id="seqvio-scatterbrain"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor={palette.cream}
      audio={meta.audio}
    >
      <Scene id="cover"    duration={220}><CoverScene /></Scene>
      <Transition type="fade" duration={10} />
      <Scene id="workflow" duration={260}><WorkflowScene /></Scene>
      <Transition type="fade" duration={10} />
      <Scene id="features" duration={240}><FeaturesScene /></Scene>
      <Transition type="fade" duration={10} />
      <Scene id="closing"  duration={240}><ClosingScene /></Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 1010,
  width: W,
  height: H,
  audio: {
    fps: FPS,
    lockToAudio: true,
    narration: [
      {
        id: 'cover',
        sceneId: 'cover',
        text: 'Scatterbrain 是 Seqvio 的便签墙风格 —— 把结构化内容像便利贴一样钉到墙上，再变成说明视频。',
      },
      {
        id: 'workflow',
        sceneId: 'workflow',
        text: '流程很简单：内容、TSX 场景、旁白、渲染 MP4，四张便签一条线串起来，全程由 TSX 驱动。',
      },
      {
        id: 'features',
        sceneId: 'features',
        text: '旁白自动对齐场景，所有素材存入 Git，相同输入永远生成相同视频，可复现、可编辑。',
      },
      {
        id: 'closing',
        sceneId: 'closing',
        text: '一条命令就能开始。可复现、可编辑、对 AI 友好 —— 用便签墙的方式讲好你的故事。',
      },
    ],
  },
};
