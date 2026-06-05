import React from 'react';
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
        fontSize={76}
        fontWeight="bold"
        position={{ x: W / 2, y: 220 }}
        align="center"
        start={0}
        duration={24}
        strokeColor={BLUE}
      />
      <DrawText
        text="用 TSX 制作白板讲解视频"
        fontSize={34}
        fontWeight="bold"
        position={{ x: W / 2, y: 305 }}
        align="center"
        start={30}
        duration={24}
        strokeColor={INK}
      />
      <DrawText
        text="结构化内容 变成 清晰、生动、可复用的介绍视频"
        fontSize={24}
        position={{ x: W / 2, y: 360 }}
        align="center"
        start={62}
        duration={24}
        strokeColor={MUTED}
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 230, y: 445 }}
        size={{ width: 180, height: 82 }}
        start={96}
        duration={20}
        fillColor="rgba(47,128,237,0.12)"
        strokeColor={BLUE}
      />
      <DrawText
        text="写脚本"
        fontSize={24}
        fontWeight="bold"
        position={{ x: 320, y: 492 }}
        align="center"
        start={120}
        duration={14}
      />
      <DrawShape
        type="arrow"
        from={{ x: 420, y: 487 }}
        to={{ x: 560, y: 487 }}
        start={138}
        duration={12}
        strokeColor={BLUE}
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 570, y: 445 }}
        size={{ width: 180, height: 82 }}
        start={154}
        duration={20}
        fillColor="rgba(39,174,96,0.12)"
        strokeColor={GREEN}
      />
      <DrawText
        text="渲染动画"
        fontSize={24}
        fontWeight="bold"
        position={{ x: 660, y: 492 }}
        align="center"
        start={178}
        duration={16}
      />
      <DrawShape
        type="arrow"
        from={{ x: 760, y: 487 }}
        to={{ x: 910, y: 487 }}
        start={198}
        duration={12}
        strokeColor={GREEN}
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 920, y: 445 }}
        size={{ width: 130, height: 82 }}
        start={214}
        duration={18}
        fillColor="rgba(242,153,74,0.12)"
        strokeColor={ORANGE}
      />
      <DrawText
        text="成片"
        fontSize={24}
        fontWeight="bold"
        position={{ x: 985, y: 492 }}
        align="center"
        start={236}
        duration={14}
        strokeColor={ORANGE}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function ProblemScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="它解决什么问题？"
        fontSize={42}
        fontWeight="bold"
        position={{ x: 170, y: 135 }}
        align="left"
        start={0}
        duration={24}
        strokeColor={BLUE}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 110, y: 190 }}
        size={{ width: 480, height: 360 }}
        start={30}
        duration={22}
        fillColor="rgba(235,87,87,0.08)"
        strokeColor={RED}
      />
      <DrawText
        text="传统方式"
        fontSize={30}
        fontWeight="bold"
        position={{ x: 350, y: 245 }}
        align="center"
        start={56}
        duration={18}
        strokeColor={RED}
      />
      <DrawText
        text="要做讲解视频，常常需要"
        fontSize={22}
        position={{ x: 160, y: 305 }}
        align="left"
        start={78}
        duration={18}
      />
      <DrawText
        text="写文案、做分镜、做动画、再剪辑"
        fontSize={22}
        position={{ x: 160, y: 350 }}
        align="left"
        start={100}
        duration={18}
      />
      <DrawText
        text="流程长，修改成本高"
        fontSize={22}
        position={{ x: 160, y: 395 }}
        align="left"
        start={122}
        duration={16}
        strokeColor={RED}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 690, y: 190 }}
        size={{ width: 480, height: 360 }}
        start={144}
        duration={22}
        fillColor="rgba(39,174,96,0.08)"
        strokeColor={GREEN}
      />
      <DrawText
        text="Seqvio 方式"
        fontSize={30}
        fontWeight="bold"
        position={{ x: 930, y: 245 }}
        align="center"
        start={170}
        duration={18}
        strokeColor={GREEN}
      />
      <DrawText
        text="把内容直接写成 TSX"
        fontSize={22}
        position={{ x: 740, y: 305 }}
        align="left"
        start={192}
        duration={18}
      />
      <DrawText
        text="画面、时序、转场都代码化表达"
        fontSize={22}
        position={{ x: 740, y: 350 }}
        align="left"
        start={214}
        duration={20}
      />
      <DrawText
        text="更适合自动化生成和持续迭代"
        fontSize={22}
        position={{ x: 740, y: 395 }}
        align="left"
        start={238}
        duration={18}
        strokeColor={GREEN}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function WorkflowScene() {
  const steps = [
    { n: '1', text: '定义讲解结构', color: BLUE, y: 210 },
    { n: '2', text: '编写白板场景', color: GREEN, y: 320 },
    { n: '3', text: '组合转场与节奏', color: ORANGE, y: 430 },
    { n: '4', text: '渲染输出 MP4', color: RED, y: 540 },
  ];

  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="Seqvio 的工作流"
        fontSize={42}
        fontWeight="bold"
        position={{ x: W / 2, y: 120 }}
        align="center"
        start={0}
        duration={22}
        strokeColor={INK}
      />

      {steps.map((step, index) => (
        <React.Fragment key={step.n}>
          <DrawShape
            type="circle"
            position={{ x: 170, y: step.y - 10 }}
            size={56}
            start={30 + index * 52}
            duration={16}
            strokeColor={step.color}
            fillColor={step.color}
          />
          <DrawText
            text={step.n}
            fontSize={24}
            fontWeight="bold"
            position={{ x: 170, y: step.y + 2 }}
            align="center"
            start={48 + index * 52}
            duration={10}
            strokeColor="#ffffff"
            textRender="stroke"
          />
          <DrawShape
            type="rounded-rectangle"
            position={{ x: 235, y: step.y - 42 }}
            size={{ width: 500, height: 78 }}
            start={60 + index * 52}
            duration={18}
            strokeColor={step.color}
            fillColor="rgba(255,255,255,0.7)"
          />
          <DrawText
            text={step.text}
            fontSize={28}
            fontWeight="bold"
            position={{ x: 275, y: step.y + 4 }}
            align="left"
            start={82 + index * 52}
            duration={16}
            strokeColor={INK}
          />
        </React.Fragment>
      ))}

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 825, y: 220 }}
        size={{ width: 320, height: 240 }}
        start={250}
        duration={22}
        strokeColor={BLUE}
        fillColor="rgba(47,128,237,0.08)"
      />
      <DrawText
        text="优势"
        fontSize={26}
        fontWeight="bold"
        position={{ x: 985, y: 270 }}
        align="center"
        start={276}
        duration={14}
        strokeColor={BLUE}
      />
      <DrawText
        text="可复用"
        fontSize={22}
        position={{ x: 875, y: 325 }}
        align="left"
        start={294}
        duration={12}
      />
      <DrawText
        text="可版本管理"
        fontSize={22}
        position={{ x: 875, y: 365 }}
        align="left"
        start={310}
        duration={14}
      />
      <DrawText
        text="适合 AI 自动生成"
        fontSize={22}
        position={{ x: 875, y: 405 }}
        align="left"
        start={328}
        duration={18}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function CapabilityScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="今天的 Seqvio 已经能做什么？"
        fontSize={40}
        fontWeight="bold"
        position={{ x: W / 2, y: 130 }}
        align="center"
        start={0}
        duration={24}
        strokeColor={GREEN}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 120, y: 215 }}
        size={{ width: 300, height: 220 }}
        start={34}
        duration={18}
        strokeColor={BLUE}
        fillColor="rgba(47,128,237,0.08)"
      />
      <DrawText
        text="白板元素"
        fontSize={28}
        fontWeight="bold"
        position={{ x: 270, y: 275 }}
        align="center"
        start={56}
        duration={14}
        strokeColor={BLUE}
      />
      <DrawText
        text="文字"
        fontSize={20}
        position={{ x: 180, y: 335 }}
        align="left"
        start={74}
        duration={10}
      />
      <DrawText
        text="图形"
        fontSize={20}
        position={{ x: 180, y: 372 }}
        align="left"
        start={88}
        duration={10}
      />
      <DrawText
        text="手绘笔尖跟随"
        fontSize={20}
        position={{ x: 180, y: 409 }}
        align="left"
        start={102}
        duration={14}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 490, y: 215 }}
        size={{ width: 300, height: 220 }}
        start={120}
        duration={18}
        strokeColor={ORANGE}
        fillColor="rgba(242,153,74,0.08)"
      />
      <DrawText
        text="多场景组合"
        fontSize={28}
        fontWeight="bold"
        position={{ x: 640, y: 275 }}
        align="center"
        start={142}
        duration={16}
        strokeColor={ORANGE}
      />
      <DrawText
        text="Scene"
        fontSize={20}
        position={{ x: 550, y: 335 }}
        align="left"
        start={162}
        duration={10}
      />
      <DrawText
        text="Transition"
        fontSize={20}
        position={{ x: 550, y: 372 }}
        align="left"
        start={176}
        duration={12}
      />
      <DrawText
        text="统一时间线"
        fontSize={20}
        position={{ x: 550, y: 409 }}
        align="left"
        start={192}
        duration={12}
      />

      <DrawShape
        type="rounded-rectangle"
        position={{ x: 860, y: 215 }}
        size={{ width: 300, height: 220 }}
        start={208}
        duration={18}
        strokeColor={GREEN}
        fillColor="rgba(39,174,96,0.08)"
      />
      <DrawText
        text="渲染输出"
        fontSize={28}
        fontWeight="bold"
        position={{ x: 1010, y: 275 }}
        align="center"
        start={230}
        duration={14}
        strokeColor={GREEN}
      />
      <DrawText
        text="TSX 打包"
        fontSize={20}
        position={{ x: 920, y: 335 }}
        align="left"
        start={248}
        duration={10}
      />
      <DrawText
        text="逐帧采集"
        fontSize={20}
        position={{ x: 920, y: 372 }}
        align="left"
        start={262}
        duration={10}
      />
      <DrawText
        text="MP4 编码"
        fontSize={20}
        position={{ x: 920, y: 409 }}
        align="left"
        start={276}
        duration={10}
      />

      <DrawText
        text="它已经是一条可用的 TSX -> MP4 生成链路"
        fontSize={26}
        fontWeight="bold"
        position={{ x: W / 2, y: 560 }}
        align="center"
        start={294}
        duration={20}
        strokeColor={INK}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function ClosingScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 220, y: 200 }}
        size={{ width: 840, height: 280 }}
        start={0}
        duration={22}
        strokeColor={BLUE}
        fillColor="rgba(47,128,237,0.06)"
      />
      <DrawText
        text="Seqvio"
        fontSize={62}
        fontWeight="bold"
        position={{ x: W / 2, y: 295 }}
        align="center"
        start={28}
        duration={18}
        strokeColor={BLUE}
      />
      <DrawText
        text="把讲解内容，稳定地变成白板视频"
        fontSize={30}
        fontWeight="bold"
        position={{ x: W / 2, y: 360 }}
        align="center"
        start={50}
        duration={18}
        strokeColor={INK}
      />
      <DrawText
        text="适合产品介绍、知识讲解、流程说明和 AI 自动生成场景"
        fontSize={22}
        position={{ x: W / 2, y: 415 }}
        align="center"
        start={72}
        duration={20}
        strokeColor={MUTED}
      />
      <DrawText
        text="现在，就可以开始写你的第一个 composition"
        fontSize={24}
        position={{ x: W / 2, y: 540 }}
        align="center"
        start={96}
        duration={20}
        strokeColor={GREEN}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export default function SeqvioBrandIntroZh() {
  return (
    <VideoComposition
      id="seqvio-brand-intro-zh"
      width={W}
      height={H}
      fps={30}
      duration={1530}
      backgroundColor="#ffffff"
    >
      <Scene id="cover" duration={280}>
        <CoverScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="problem" duration={290}>
        <ProblemScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="workflow" duration={380}>
        <WorkflowScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="capability" duration={330}>
        <CapabilityScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="closing" duration={202}>
        <ClosingScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta = {
  duration: 1530,
  fps: 30,
};
