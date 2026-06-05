import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene, Transition } from '@seqvio/core';
import {
  DrawShape,
  DrawText,
  Hand,
  WhiteboardScene,
  excalidrawTheme,
} from '@seqvio/whiteboard';

const W = 1280;
const H = 720;
const FPS = 30;
const INK = '#1f2937';
const MUTED = '#64748b';
const BLUE = '#2563eb';
const GREEN = '#16a34a';
const ORANGE = '#f97316';
const PURPLE = '#7c3aed';

function IntroScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="Seqvio"
        fontSize={82}
        fontWeight="bold"
        position={{ x: W / 2, y: 170 }}
        align="center"
        start={0}
        duration={28}
        strokeColor={BLUE}
      />
      <DrawText
        text="把结构化内容变成讲解视频"
        fontSize={38}
        fontWeight="bold"
        position={{ x: W / 2, y: 260 }}
        align="center"
        start={34}
        duration={30}
        strokeColor={INK}
      />
      <DrawText
        text="面向课程、产品 walkthrough 和技术概念说明"
        fontSize={26}
        position={{ x: W / 2, y: 326 }}
        align="center"
        start={72}
        duration={26}
        strokeColor={MUTED}
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 220, y: 425 }}
        size={{ width: 840, height: 112 }}
        start={110}
        duration={24}
        strokeColor={BLUE}
        fillColor="rgba(37, 99, 235, 0.08)"
      />
      <DrawText
        text="Structured content  →  Scenes  →  Narrated MP4"
        fontSize={30}
        fontWeight="bold"
        position={{ x: W / 2, y: 490 }}
        align="center"
        start={140}
        duration={32}
        strokeColor={BLUE}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function WorkflowScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="不是从空白动画画布开始"
        fontSize={44}
        fontWeight="bold"
        position={{ x: W / 2, y: 104 }}
        align="center"
        start={0}
        duration={26}
        strokeColor={GREEN}
      />

      {[
        { label: '脚本', x: 185, color: BLUE },
        { label: '场景', x: 425, color: GREEN },
        { label: '旁白', x: 665, color: ORANGE },
        { label: '字幕', x: 905, color: PURPLE },
      ].map((item, index) => (
        <React.Fragment key={item.label}>
          <DrawShape
            type="rounded-rectangle"
            position={{ x: item.x, y: 255 }}
            size={{ width: 170, height: 112 }}
            start={42 + index * 34}
            duration={20}
            strokeColor={item.color}
            fillColor={`${item.color}18`}
          />
          <DrawText
            text={item.label}
            fontSize={30}
            fontWeight="bold"
            position={{ x: item.x + 85, y: 320 }}
            align="center"
            start={66 + index * 34}
            duration={14}
            strokeColor={item.color}
          />
          {index < 3 ? (
            <DrawShape
              type="arrow"
              from={{ x: item.x + 178, y: 312 }}
              to={{ x: item.x + 232, y: 312 }}
              start={84 + index * 34}
              duration={10}
              strokeColor={INK}
            />
          ) : null}
        </React.Fragment>
      ))}

      <DrawText
        text="Seqvio 把这些讲解视频的关键元素放在同一份 composition 里"
        fontSize={28}
        position={{ x: W / 2, y: 500 }}
        align="center"
        start={190}
        duration={36}
        strokeColor={INK}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function WhiteboardSceneDemo() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="白板风格是一等能力"
        fontSize={44}
        fontWeight="bold"
        position={{ x: W / 2, y: 104 }}
        align="center"
        start={0}
        duration={26}
        strokeColor={ORANGE}
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 190, y: 210 }}
        size={{ width: 900, height: 310 }}
        start={40}
        duration={26}
        strokeColor={ORANGE}
        fillColor="rgba(249, 115, 22, 0.08)"
      />
      <DrawText
        text="手写文字"
        fontSize={34}
        fontWeight="bold"
        position={{ x: 310, y: 300 }}
        align="center"
        start={76}
        duration={18}
        strokeColor={BLUE}
      />
      <DrawText
        text="草图形状"
        fontSize={34}
        fontWeight="bold"
        position={{ x: W / 2, y: 300 }}
        align="center"
        start={102}
        duration={18}
        strokeColor={GREEN}
      />
      <DrawText
        text="画笔节奏"
        fontSize={34}
        fontWeight="bold"
        position={{ x: 970, y: 300 }}
        align="center"
        start={128}
        duration={18}
        strokeColor={PURPLE}
      />
      <DrawShape
        type="arrow"
        from={{ x: 330, y: 365 }}
        to={{ x: 940, y: 365 }}
        start={160}
        duration={24}
        strokeColor={INK}
      />
      <DrawText
        text="适合知识点拆解、流程说明和产品 onboarding"
        fontSize={28}
        position={{ x: W / 2, y: 452 }}
        align="center"
        start={192}
        duration={34}
        strokeColor={INK}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function ClosingScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="输出可复现的视频资产"
        fontSize={46}
        fontWeight="bold"
        position={{ x: W / 2, y: 120 }}
        align="center"
        start={0}
        duration={28}
        strokeColor={PURPLE}
      />
      <DrawText
        text="画面、旁白、字幕和渲染命令都可以进入版本管理"
        fontSize={28}
        position={{ x: W / 2, y: 205 }}
        align="center"
        start={36}
        duration={32}
        strokeColor={INK}
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 280, y: 315 }}
        size={{ width: 720, height: 130 }}
        start={84}
        duration={24}
        strokeColor={GREEN}
        fillColor="rgba(22, 163, 74, 0.08)"
      />
      <DrawText
        text="seqvio-render  →  MP4"
        fontSize={38}
        fontWeight="bold"
        position={{ x: W / 2, y: 392 }}
        align="center"
        start={116}
        duration={26}
        strokeColor={GREEN}
      />
      <DrawText
        text="Seqvio：为讲解视频而设计的结构化工作流"
        fontSize={30}
        fontWeight="bold"
        position={{ x: W / 2, y: 548 }}
        align="center"
        start={162}
        duration={34}
        strokeColor={BLUE}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export default function SeqvioOverviewZh() {
  return (
    <VideoComposition
      id="seqvio-overview-zh"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor="#ffffff"
      audio={meta.audio}
    >
      <Scene id="intro">
        <IntroScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="workflow">
        <WorkflowScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="whiteboard">
        <WhiteboardSceneDemo />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="closing">
        <ClosingScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  audio: {
    fps: FPS,
    lockToAudio: true,
    narration: [
      {
        id: 'intro',
        sceneId: 'intro',
        text: 'Seqvio 是一个面向讲解视频的结构化工作流。它把课程、产品介绍和技术概念，组织成清晰的场景，并渲染成可以交付的 MP4。',
      },
      {
        id: 'workflow',
        sceneId: 'workflow',
        text: '它不是从空白动画画布开始，而是把脚本、场景、旁白和字幕放在同一份 composition 里，让内容和时间关系更容易维护。',
      },
      {
        id: 'whiteboard',
        sceneId: 'whiteboard',
        text: '当前的核心视觉能力是白板讲解。你可以使用手写文字、草图形状和画笔节奏，快速表达知识点、流程和产品 onboarding。',
      },
      {
        id: 'closing',
        sceneId: 'closing',
        text: '最后，画面、旁白、字幕和渲染命令都可以进入版本管理。Seqvio 让讲解视频变成可复现、可修改、也适合 AI 协作生成的视频资产。',
      },
    ],
  },
};
