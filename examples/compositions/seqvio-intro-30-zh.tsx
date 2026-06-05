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
const DURATION = 900;
const BLUE = '#2f80ed';
const GREEN = '#27ae60';
const ORANGE = '#f2994a';
const RED = '#eb5757';
const INK = '#1f2937';
const MUTED = '#6b7280';

function CoverScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="Seqvio"
        fontSize={78}
        fontWeight="bold"
        position={{ x: W / 2, y: 188 }}
        align="center"
        start={0}
        duration={28}
        strokeColor={BLUE}
      />
      <DrawText
        text="把结构化内容变成可复用的讲解视频"
        fontSize={34}
        fontWeight="bold"
        position={{ x: W / 2, y: 270 }}
        align="center"
        start={26}
        duration={24}
        strokeColor={INK}
      />
      <DrawText
        text="TSX 编排画面、节奏、转场与旁白"
        fontSize={26}
        position={{ x: W / 2, y: 328 }}
        align="center"
        start={54}
        duration={20}
        strokeColor={MUTED}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 220, y: 430 }}
        size={{ width: 190, height: 88 }}
        start={90}
        duration={18}
        strokeColor={BLUE}
        fillColor="rgba(47,128,237,0.10)"
      />
      <DrawText
        text="脚本"
        fontSize={26}
        fontWeight="bold"
        position={{ x: 315, y: 480 }}
        align="center"
        start={112}
        duration={12}
      />
      <DrawShape
        type="arrow"
        from={{ x: 420, y: 474 }}
        to={{ x: 565, y: 474 }}
        start={126}
        duration={10}
        strokeColor={BLUE}
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 580, y: 430 }}
        size={{ width: 190, height: 88 }}
        start={138}
        duration={18}
        strokeColor={GREEN}
        fillColor="rgba(39,174,96,0.10)"
      />
      <DrawText
        text="TSX 场景"
        fontSize={26}
        fontWeight="bold"
        position={{ x: 675, y: 480 }}
        align="center"
        start={160}
        duration={14}
      />
      <DrawShape
        type="arrow"
        from={{ x: 780, y: 474 }}
        to={{ x: 930, y: 474 }}
        start={176}
        duration={10}
        strokeColor={GREEN}
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 945, y: 430 }}
        size={{ width: 120, height: 88 }}
        start={188}
        duration={18}
        strokeColor={ORANGE}
        fillColor="rgba(242,153,74,0.10)"
      />
      <DrawText
        text="MP4"
        fontSize={24}
        fontWeight="bold"
        position={{ x: 1005, y: 480 }}
        align="center"
        start={210}
        duration={12}
        strokeColor={ORANGE}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function WhyScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="为什么它更适合团队与 AI？"
        fontSize={42}
        fontWeight="bold"
        position={{ x: W / 2, y: 118 }}
        align="center"
        start={0}
        duration={24}
        strokeColor={GREEN}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 110, y: 195 }}
        size={{ width: 470, height: 360 }}
        start={34}
        duration={20}
        strokeColor={RED}
        fillColor="rgba(235,87,87,0.08)"
      />
      <DrawText
        text="传统视频流程"
        fontSize={30}
        fontWeight="bold"
        position={{ x: 345, y: 246 }}
        align="center"
        start={58}
        duration={16}
        strokeColor={RED}
      />
      <DrawText
        text="脚本、分镜、动画、剪辑"
        fontSize={22}
        position={{ x: 165, y: 315 }}
        align="left"
        start={82}
        duration={16}
      />
      <DrawText
        text="修改一处，常常要返工整段"
        fontSize={22}
        position={{ x: 165, y: 360 }}
        align="left"
        start={104}
        duration={18}
      />
      <DrawText
        text="难复用，也难自动化"
        fontSize={22}
        position={{ x: 165, y: 405 }}
        align="left"
        start={128}
        duration={16}
        strokeColor={RED}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 700, y: 195 }}
        size={{ width: 470, height: 360 }}
        start={150}
        duration={20}
        strokeColor={GREEN}
        fillColor="rgba(39,174,96,0.08)"
      />
      <DrawText
        text="Seqvio 方式"
        fontSize={30}
        fontWeight="bold"
        position={{ x: 935, y: 246 }}
        align="center"
        start={174}
        duration={16}
        strokeColor={GREEN}
      />
      <DrawText
        text="用 TSX 明确描述画面和时间"
        fontSize={22}
        position={{ x: 755, y: 315 }}
        align="left"
        start={198}
        duration={18}
      />
      <DrawText
        text="场景可组合，脚本可版本管理"
        fontSize={22}
        position={{ x: 755, y: 360 }}
        align="left"
        start={222}
        duration={18}
      />
      <DrawText
        text="更适合批量生成和持续迭代"
        fontSize={22}
        position={{ x: 755, y: 405 }}
        align="left"
        start={246}
        duration={18}
        strokeColor={GREEN}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function WorkflowScene() {
  const steps = [
    { n: '1', label: '组织信息结构', color: BLUE, y: 214 },
    { n: '2', label: '编排 TSX 场景', color: GREEN, y: 320 },
    { n: '3', label: '加入旁白与字幕', color: ORANGE, y: 426 },
    { n: '4', label: '渲染输出成片', color: RED, y: 532 },
  ];

  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="30 秒内完成清晰介绍"
        fontSize={42}
        fontWeight="bold"
        position={{ x: W / 2, y: 118 }}
        align="center"
        start={0}
        duration={24}
        strokeColor={INK}
      />

      {steps.map((step, index) => (
        <React.Fragment key={step.n}>
          <DrawShape
            type="circle"
            position={{ x: 168, y: step.y - 8 }}
            size={56}
            start={30 + index * 44}
            duration={14}
            strokeColor={step.color}
            fillColor={step.color}
          />
          <DrawText
            text={step.n}
            fontSize={24}
            fontWeight="bold"
            position={{ x: 168, y: step.y + 4 }}
            align="center"
            start={46 + index * 44}
            duration={10}
            strokeColor="#ffffff"
            textRender="stroke"
          />
          <DrawShape
            type="rounded-rectangle"
            position={{ x: 235, y: step.y - 42 }}
            size={{ width: 520, height: 80 }}
            start={58 + index * 44}
            duration={16}
            strokeColor={step.color}
            fillColor="rgba(255,255,255,0.72)"
          />
          <DrawText
            text={step.label}
            fontSize={28}
            fontWeight="bold"
            position={{ x: 276, y: step.y + 4 }}
            align="left"
            start={78 + index * 44}
            duration={14}
            strokeColor={INK}
          />
        </React.Fragment>
      ))}

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 845, y: 245 }}
        size={{ width: 280, height: 210 }}
        start={218}
        duration={20}
        strokeColor={BLUE}
        fillColor="rgba(47,128,237,0.08)"
      />
      <DrawText
        text="结果"
        fontSize={28}
        fontWeight="bold"
        position={{ x: 985, y: 295 }}
        align="center"
        start={242}
        duration={14}
        strokeColor={BLUE}
      />
      <DrawText
        text="可读"
        fontSize={22}
        position={{ x: 895, y: 350 }}
        align="left"
        start={260}
        duration={10}
      />
      <DrawText
        text="可改"
        fontSize={22}
        position={{ x: 895, y: 387 }}
        align="left"
        start={274}
        duration={10}
      />
      <DrawText
        text="可扩展"
        fontSize={22}
        position={{ x: 895, y: 424 }}
        align="left"
        start={288}
        duration={12}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export default function SeqvioIntro30Zh() {
  return (
    <VideoComposition
      id="seqvio-intro-30-zh"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor="#ffffff"
      audio={meta.audio}
    >
      <Scene id="cover">
        <CoverScene />
      </Scene>
      <Transition type="fade" duration={15} />
      <Scene id="why">
        <WhyScene />
      </Scene>
      <Transition type="fade" duration={15} />
      <Scene id="workflow">
        <WorkflowScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  duration: DURATION,
  fps: FPS,
  audio: {
    fps: FPS,
    lockToAudio: true,
    narration: [
      {
        id: 'cover-zh-intro',
        sceneId: 'cover',
        text:
          'Seqvio 是一个用 TSX 生成讲解视频的框架。它把脚本、画面、节奏、转场和旁白放进同一套可维护的代码里。',
      },
      {
        id: 'why-zh-intro',
        sceneId: 'why',
        text:
          '对于团队来说，这意味着视频可以复用、可以版本管理，也更适合 AI 自动生成，而不是每次都从剪辑软件里重新拼一遍。',
      },
      {
        id: 'workflow-zh-intro',
        sceneId: 'workflow',
        text:
          '你只需要组织内容，编排场景，加入配音和字幕，就能稳定渲染出清晰、统一、可以持续迭代的三十秒介绍视频。',
      },
    ],
    captions: [
      {
        sceneId: 'cover',
        text: 'Seqvio 是一个用 TSX 生成讲解视频的框架。',
        startMs: 0,
        endMs: 3500,
      },
      {
        sceneId: 'cover',
        text: '它把脚本、画面、节奏、转场和旁白放进同一套可维护的代码里。',
        startMs: 3500,
        endMs: 8200,
      },
      {
        sceneId: 'why',
        text: '对于团队来说，这意味着视频可以复用、可以版本管理，也更适合 AI 自动生成。',
        startMs: 8200,
        endMs: 15000,
      },
      {
        sceneId: 'why',
        text: '而不是每次都从剪辑软件里重新拼一遍。',
        startMs: 15000,
        endMs: 19500,
      },
      {
        sceneId: 'workflow',
        text: '你只需要组织内容，编排场景，加入配音和字幕。',
        startMs: 19500,
        endMs: 24500,
      },
      {
        sceneId: 'workflow',
        text: '就能稳定渲染出清晰、统一、可以持续迭代的三十秒介绍视频。',
        startMs: 24500,
        endMs: 30000,
      },
    ],
  },
};
