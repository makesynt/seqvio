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
        text="Structured content into reusable explainer video"
        fontSize={34}
        fontWeight="bold"
        position={{ x: W / 2, y: 270 }}
        align="center"
        start={26}
        duration={24}
        strokeColor={INK}
      />
      <DrawText
        text="TSX controls visuals, timing, transitions, and narration"
        fontSize={24}
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
        text="Script"
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
        text="TSX Scenes"
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
        text="Why does it fit teams and AI workflows?"
        fontSize={40}
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
        text="Classic video workflow"
        fontSize={28}
        fontWeight="bold"
        position={{ x: 345, y: 246 }}
        align="center"
        start={58}
        duration={16}
        strokeColor={RED}
      />
      <DrawText
        text="Script, storyboard, animation, editing"
        fontSize={22}
        position={{ x: 155, y: 315 }}
        align="left"
        start={82}
        duration={16}
      />
      <DrawText
        text="One change often means reworking the whole segment"
        fontSize={22}
        position={{ x: 155, y: 360 }}
        align="left"
        start={104}
        duration={18}
      />
      <DrawText
        text="Hard to reuse and hard to automate"
        fontSize={22}
        position={{ x: 155, y: 405 }}
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
        text="The Seqvio model"
        fontSize={28}
        fontWeight="bold"
        position={{ x: 935, y: 246 }}
        align="center"
        start={174}
        duration={16}
        strokeColor={GREEN}
      />
      <DrawText
        text="Describe visuals and timing directly in TSX"
        fontSize={22}
        position={{ x: 748, y: 315 }}
        align="left"
        start={198}
        duration={18}
      />
      <DrawText
        text="Reusable scenes and version-controlled scripts"
        fontSize={22}
        position={{ x: 748, y: 360 }}
        align="left"
        start={222}
        duration={18}
      />
      <DrawText
        text="A much cleaner base for generation and iteration"
        fontSize={22}
        position={{ x: 748, y: 405 }}
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
    { n: '1', label: 'Shape the message', color: BLUE, y: 214 },
    { n: '2', label: 'Compose TSX scenes', color: GREEN, y: 320 },
    { n: '3', label: 'Add narration and captions', color: ORANGE, y: 426 },
    { n: '4', label: 'Render the final video', color: RED, y: 532 },
  ];

  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="A clear intro in thirty seconds"
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
            size={{ width: 540, height: 80 }}
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
        text="Outcome"
        fontSize={28}
        fontWeight="bold"
        position={{ x: 985, y: 295 }}
        align="center"
        start={242}
        duration={14}
        strokeColor={BLUE}
      />
      <DrawText
        text="Readable"
        fontSize={22}
        position={{ x: 895, y: 350 }}
        align="left"
        start={260}
        duration={10}
      />
      <DrawText
        text="Editable"
        fontSize={22}
        position={{ x: 895, y: 387 }}
        align="left"
        start={274}
        duration={10}
      />
      <DrawText
        text="Scalable"
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

export default function SeqvioIntro30En() {
  return (
    <VideoComposition
      id="seqvio-intro-30-en"
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
        id: 'cover-en-intro',
        sceneId: 'cover',
        text:
          'Seqvio is a framework for building explainer videos with TSX. It keeps script, visuals, timing, transitions, and narration inside one maintainable codebase.',
      },
      {
        id: 'why-en-intro',
        sceneId: 'why',
        text:
          'For teams, that means videos become reusable, version controlled, and much easier to generate with AI instead of rebuilding the same message by hand every time.',
      },
      {
        id: 'workflow-en-intro',
        sceneId: 'workflow',
        text:
          'You shape the message, compose the scenes, add voice and captions, and render a clear, consistent introduction with a predictable workflow.',
      },
    ],
    captions: [
      {
        sceneId: 'cover',
        text: 'Seqvio is a framework for building explainer videos with TSX.',
        startMs: 0,
        endMs: 3800,
      },
      {
        sceneId: 'cover',
        text: 'It keeps script, visuals, timing, transitions, and narration inside one maintainable codebase.',
        startMs: 3800,
        endMs: 9000,
      },
      {
        sceneId: 'why',
        text: 'For teams, that means videos become reusable, version controlled, and much easier to generate with AI.',
        startMs: 9000,
        endMs: 16500,
      },
      {
        sceneId: 'why',
        text: 'Instead of rebuilding the same message by hand every time.',
        startMs: 16500,
        endMs: 20500,
      },
      {
        sceneId: 'workflow',
        text: 'You shape the message, compose the scenes, add voice and captions.',
        startMs: 20500,
        endMs: 25500,
      },
      {
        sceneId: 'workflow',
        text: 'Then render a clear, consistent introduction with a predictable workflow.',
        startMs: 25500,
        endMs: 30000,
      },
    ],
  },
};
