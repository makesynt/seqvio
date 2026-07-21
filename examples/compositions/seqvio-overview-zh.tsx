import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene } from '@seqvio/core';
import {
  DrawShape,
  DrawText,
  Hand,
  WhiteboardScene,
  excalidrawTheme,
} from '@seqvio/whiteboard';
import {
  Doodle,
  PinnedList,
  Polaroid,
  ScatterScene,
  Scrawl,
  StickyNote,
  palette,
  typeScale,
} from '@seqvio/scatterbrain';
import {
  BrowserFrame,
  Callout,
  CursorPath,
  ProductDemoScene,
  ProductTitle,
  ScreenshotPlaceholder,
  productPalette,
} from '@seqvio/product-demo';

const W = 1280;
const H = 720;
const FPS = 30;
const TS = typeScale;
const LONG_CANG_STACK =
  '"Long Cang", Virgil, "Noto Sans SC", "Microsoft YaHei", cursive';

// 1 — 开场：软木板便签，落定"agent 时代的讲解视频工具链"定位
function IntroScene() {
  return (
    <ScatterScene surface="cork" style={{ fontFamily: LONG_CANG_STACK }}>
      <StickyNote
        position={{ x: 78, y: 70 }}
        width={244}
        color="orange"
        rotate={-4}
        attach="tape"
        start={0}
        duration={14}
        style={{ padding: '14px 20px' }}
      >
        <span style={{ fontSize: TS.caption }}>SEQVIO · V0.5</span>
      </StickyNote>

      <Scrawl
        text="Seqvio"
        position={{ x: 88, y: 188 }}
        fontSize={150}
        color="#fff8e7"
        rotate={-2}
        start={10}
        duration={24}
      />
      <Scrawl
        text="agent 时代的讲解视频工具链"
        position={{ x: 96, y: 348 }}
        fontSize={50}
        color="#fff8e7"
        rotate={-1}
        start={34}
        duration={22}
      />

      <StickyNote
        title="prompt.md"
        position={{ x: 772, y: 88 }}
        width={300}
        color="yellow"
        rotate={3}
        attach="pin"
        pinColor="red"
        start={54}
        duration={16}
      >
        课程、产品介绍、技术概念
      </StickyNote>
      <StickyNote
        title="storyboard.json"
        position={{ x: 884, y: 300 }}
        width={312}
        color="green"
        rotate={-3}
        attach="pin"
        pinColor="gold"
        start={76}
        duration={16}
      >
        场景、旁白、视觉意图、时间关系
      </StickyNote>
      <Polaroid
        caption="MP4 · rendered locally"
        position={{ x: 656, y: 386 }}
        width={248}
        rotate={-5}
        fill="linear-gradient(135deg, #dbeafe, #dcfce7)"
        start={96}
        duration={16}
      >
        <span style={{ fontFamily: LONG_CANG_STACK, fontSize: 62, color: palette.ink }}>
          MP4
        </span>
      </Polaroid>

      <Doodle
        type="arrow"
        position={{ x: 720, y: 244 }}
        size={130}
        color="#fff8e7"
        rotate={22}
        start={104}
        duration={18}
        opacity={0.7}
      />
      <Doodle
        type="star"
        position={{ x: 1118, y: 80 }}
        size={58}
        color="#fff8e7"
        rotate={8}
        start={124}
        duration={16}
        opacity={0.65}
      />
    </ScatterScene>
  );
}

// 2 — 白板风格：真实使用 @seqvio/whiteboard 的手写文字/草图/画笔
function WhiteboardStyleScene() {
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture="whiteboard"
      theme={excalidrawTheme}
    >
      <DrawText
        text="@seqvio/whiteboard"
        position={{ x: 70, y: 84 }}
        fontSize={44}
        fontWeight="bold"
        strokeColor="#1971c2"
        start={4}
        duration={30}
      />
      <DrawText
        text="手写文字、草图形状、画笔节奏"
        position={{ x: 72, y: 138 }}
        fontSize={24}
        strokeColor="#868e96"
        start={34}
        duration={26}
      />
      <DrawShape
        type="line"
        from={{ x: 72, y: 166 }}
        to={{ x: 1208, y: 166 }}
        strokeColor="#adb5bd"
        strokeWidth={1.4}
        start={60}
        duration={18}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 116, y: 250 }}
        size={{ width: 220, height: 120 }}
        strokeColor="#1e1e1e"
        fillColor="none"
        borderRadius={16}
        start={70}
        duration={22}
      />
      <DrawText
        text="概念"
        position={{ x: 226, y: 322 }}
        align="center"
        fontSize={34}
        fontWeight="bold"
        strokeColor="#1e1e1e"
        start={92}
        duration={18}
      />

      <DrawShape
        type="arrow"
        from={{ x: 350, y: 310 }}
        to={{ x: 486, y: 310 }}
        strokeColor="#1971c2"
        start={104}
        duration={16}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 500, y: 250 }}
        size={{ width: 220, height: 120 }}
        strokeColor="#2f9e44"
        fillColor="none"
        borderRadius={16}
        start={118}
        duration={22}
      />
      <DrawText
        text="流程"
        position={{ x: 610, y: 322 }}
        align="center"
        fontSize={34}
        fontWeight="bold"
        strokeColor="#2f9e44"
        start={138}
        duration={18}
      />

      <DrawShape
        type="arrow"
        from={{ x: 734, y: 310 }}
        to={{ x: 870, y: 310 }}
        strokeColor="#1971c2"
        start={150}
        duration={16}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 884, y: 250 }}
        size={{ width: 240, height: 120 }}
        strokeColor="#e8590c"
        fillColor="none"
        borderRadius={16}
        start={164}
        duration={22}
      />
      <DrawText
        text="onboarding"
        position={{ x: 1004, y: 322 }}
        align="center"
        fontSize={30}
        fontWeight="bold"
        strokeColor="#e8590c"
        start={186}
        duration={18}
      />

      <DrawText
        text="用画笔一步步讲清楚一件事"
        position={{ x: 640, y: 500 }}
        align="center"
        fontSize={30}
        fontWeight="bold"
        strokeColor="#1e1e1e"
        start={206}
        duration={30}
      />
      <DrawShape
        type="underline"
        from={{ x: 430, y: 528 }}
        to={{ x: 850, y: 528 }}
        strokeColor="#f08c00"
        strokeWidth={3}
        start={234}
        duration={18}
      />

      <Hand action="write" position={{ x: 860, y: 520 }} />
    </WhiteboardScene>
  );
}

// 3 — 便签/工作台风格：@seqvio/scatterbrain
function ScatterStyleScene() {
  return (
    <ScatterScene surface="warm" style={{ fontFamily: LONG_CANG_STACK }}>
      <Scrawl
        text="@seqvio/scatterbrain"
        position={{ x: 72, y: 58 }}
        fontSize={TS.h1}
        rotate={-2}
        start={0}
        duration={18}
      />
      <Doodle
        type="underline"
        position={{ x: 76, y: 132 }}
        size={300}
        color={palette.pinRed}
        start={14}
        duration={16}
      />

      <PinnedList
        items={['便签工作台', '手写关键词', '箭头和圈注', '灵感墙 -> 讲解']}
        position={{ x: 76, y: 190 }}
        itemWidth={360}
        start={28}
        stagger={14}
      />

      <Polaroid
        caption="preview frame"
        position={{ x: 585, y: 128 }}
        width={312}
        rotate={4}
        fill="linear-gradient(135deg, #bfdbfe, #fef3c7)"
        start={48}
        duration={16}
      >
        <span style={{ fontFamily: LONG_CANG_STACK, fontSize: 50, color: palette.ink }}>
          scene 01
        </span>
      </Polaroid>
      <StickyNote
        title="workshop"
        position={{ x: 858, y: 300 }}
        width={318}
        color="blue"
        rotate={-3}
        attach="pin"
        pinColor="blue"
        start={72}
        duration={16}
      >
        软木板、便签、涂鸦，适合发散和梳理想法。
      </StickyNote>
      <StickyNote
        title="同一条管线"
        position={{ x: 560, y: 498 }}
        width={330}
        color="pink"
        rotate={-2}
        attach="tape"
        start={104}
        duration={16}
      >
        风格不同，时序、旁白和渲染契约完全一致。
      </StickyNote>
      <Doodle
        type="arrow"
        position={{ x: 480, y: 360 }}
        size={135}
        color={palette.ink}
        rotate={-18}
        start={120}
        duration={20}
      />
      <Doodle
        type="squiggle"
        position={{ x: 1050, y: 95 }}
        size={140}
        color={palette.pinBlue}
        rotate={12}
        start={138}
        duration={20}
        opacity={0.65}
      />
    </ScatterScene>
  );
}

// 4 — 产品演示风格 + 工作流：@seqvio/product-demo
function WorkflowScene() {
  return (
    <ProductDemoScene
      width={W}
      height={H}
      background="#EEF2F6"
      style={{ fontFamily: LONG_CANG_STACK }}
    >
      <ProductTitle
        title="@seqvio/product-demo + 确定性工作流"
        subtitle="agent 产出结构，renderer 负责校验、对齐旁白、本地渲染。"
        position={{ x: 64, y: 56 }}
        start={0}
      />

      <BrowserFrame
        position={{ x: 70, y: 232 }}
        width={730}
        height={396}
        url="seqvio.local/workflow"
        title="Seqvio Render Console"
        chromeFontFamily={LONG_CANG_STACK}
        start={36}
      >
        <ScreenshotPlaceholder label="prompt.md -> storyboard.json" start={52} />
      </BrowserFrame>

      <CursorPath
        points={[
          { x: 212, y: 492 },
          { x: 420, y: 448 },
          { x: 606, y: 516 },
          { x: 746, y: 430 },
        ]}
        start={94}
        duration={62}
      />
      <Callout
        text="Storyboard IR 能被 agent 生成、校验、修复，再确定性地编译。"
        position={{ x: 848, y: 262 }}
        width={318}
        start={118}
      />
      <Callout
        text="voice is the clock：narration.wav 驱动画面时长。"
        position={{ x: 892, y: 438 }}
        width={300}
        start={152}
        accent="#F97316"
      />
    </ProductDemoScene>
  );
}

// 5 — 收尾：一切进入版本管理，确定性可复现
function ClosingScene() {
  return (
    <ProductDemoScene
      width={W}
      height={H}
      background="#101828"
      style={{ fontFamily: LONG_CANG_STACK }}
    >
      <div
        style={{
          position: 'absolute',
          left: 72,
          top: 70,
          fontFamily: LONG_CANG_STACK,
          color: '#F8FAFC',
        }}
      >
        <div style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 850 }}>
          确定性的、可复现的视频资产
        </div>
        <div
          style={{
            marginTop: 18,
            maxWidth: 580,
            fontSize: 24,
            lineHeight: 1.35,
            color: '#B7C8E6',
          }}
        >
          画面、旁白、字幕、QA 和渲染命令都进入版本管理。
        </div>
      </div>
      <BrowserFrame
        position={{ x: 70, y: 268 }}
        width={620}
        height={300}
        url="repo/seqvio/examples/compositions"
        title="Versioned source"
        chromeFontFamily={LONG_CANG_STACK}
        start={34}
        style={{ boxShadow: '0 22px 60px rgba(0,0,0,0.35)' }}
      >
        <div style={{ padding: 28, fontFamily: LONG_CANG_STACK, fontSize: 18 }}>
          <div style={{ color: '#2563EB' }}>examples/compositions/</div>
          <div style={{ marginTop: 16 }}>seqvio-overview-zh.tsx</div>
          <div style={{ marginTop: 12 }}>audio-manifest.resolved.json</div>
          <div style={{ marginTop: 12 }}>QA snapshots</div>
          <div style={{ marginTop: 12, color: '#16A34A' }}>output.mp4</div>
        </div>
      </BrowserFrame>
      <CursorPath
        points={[
          { x: 180, y: 430 },
          { x: 410, y: 392 },
          { x: 610, y: 502 },
          { x: 760, y: 420 },
        ]}
        start={74}
        duration={56}
        color="#22C55E"
      />
      <Callout
        text="seqvio-render 把 TSX、CosyVoice 音轨和本地渲染合成一个 MP4。"
        position={{ x: 768, y: 300 }}
        width={392}
        start={96}
        accent="#22C55E"
      />
      <div
        style={{
          position: 'absolute',
          left: 796,
          top: 470,
          width: 300,
          height: 120,
          background: '#EAF1FF',
          color: '#101828',
          display: 'grid',
          placeItems: 'center',
          fontFamily: LONG_CANG_STACK,
          fontSize: 46,
          fontWeight: 900,
          boxShadow: '0 20px 55px rgba(0,0,0,0.3)',
        }}
      >
        MP4
      </div>
    </ProductDemoScene>
  );
}

export default function SeqvioOverviewZh() {
  return (
    <VideoComposition
      id="seqvio-overview-zh"
      width={W}
      height={H}
      fps={FPS}
      duration={meta.duration}
      backgroundColor="#ffffff"
      audio={meta.audio}
    >
      {/* No <Transition> between scenes: transitions insert extra frames into
          the video timeline, which would drift the muxed narration (offsets
          computed purely from resolved cue durations) out of sync with the
          visuals scene by scene. See loop-engineering-explainer.tsx for the
          same constraint (TRANSITION = 0) on a cosyvoice-narrated render. */}
      <Scene id="intro" duration={343}>
        <IntroScene />
      </Scene>
      <Scene id="whiteboard" duration={293}>
        <WhiteboardStyleScene />
      </Scene>
      <Scene id="scatterbrain" duration={300}>
        <ScatterStyleScene />
      </Scene>
      <Scene id="workflow" duration={342}>
        <WorkflowScene />
      </Scene>
      <Scene id="closing" duration={361}>
        <ClosingScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  duration: 1639,
  fps: FPS,
  width: W,
  height: H,
  audio: {
    fps: FPS,
    lockToAudio: true,
    narration: [
      {
        id: 'intro',
        sceneId: 'intro',
        text: 'Seqvio 是 agent 时代的讲解视频工具链。它把课程、产品介绍和技术概念，组织成清晰的场景，并在本地确定性地渲染成可以交付的 MP4。',
      },
      {
        id: 'whiteboard',
        sceneId: 'whiteboard',
        text: 'Seqvio 的视觉能力由多个风格包提供。whiteboard 包给你手写文字、草图形状和画笔节奏，适合一步步讲清楚一个概念或流程。',
      },
      {
        id: 'scatterbrain',
        sceneId: 'scatterbrain',
        text: 'scatterbrain 包提供便签和软木板式的工作台场景，适合发散和梳理想法。风格不同，但时序、旁白和渲染契约完全一致。',
      },
      {
        id: 'workflow',
        sceneId: 'workflow',
        text: 'product-demo 包用来做产品演示。整个流程是确定性的：agent 产出结构化的 storyboard，renderer 负责校验、对齐旁白、本地渲染，让画面时长跟随合成出来的语音。',
      },
      {
        id: 'closing',
        sceneId: 'closing',
        text: '最后，画面、旁白、字幕、视觉 QA 和渲染命令都可以进入版本管理。Seqvio 让讲解视频变成确定性的、可复现的、也适合 AI 协作生成的视频资产。',
      },
    ],
  },
};
