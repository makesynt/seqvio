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
        text="Structured content to explainer videos"
        fontSize={38}
        fontWeight="bold"
        position={{ x: W / 2, y: 260 }}
        align="center"
        start={34}
        duration={30}
        strokeColor={INK}
      />
      <DrawText
        text="For lessons, product walkthroughs, and technical concepts"
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
        text="Content  ->  Scenes  ->  Narration  ->  MP4"
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
        text="Built for explainer workflows"
        fontSize={44}
        fontWeight="bold"
        position={{ x: W / 2, y: 104 }}
        align="center"
        start={0}
        duration={26}
        strokeColor={GREEN}
      />

      {[
        { label: 'Script', x: 185, color: BLUE },
        { label: 'Scenes', x: 425, color: GREEN },
        { label: 'Voice', x: 665, color: ORANGE },
        { label: 'Captions', x: 905, color: PURPLE },
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
        text="Seqvio keeps the key parts of an explainer video in one composition."
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
        text="Whiteboard is a first-class style"
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
        text="Text"
        fontSize={34}
        fontWeight="bold"
        position={{ x: 310, y: 300 }}
        align="center"
        start={76}
        duration={18}
        strokeColor={BLUE}
      />
      <DrawText
        text="Sketches"
        fontSize={34}
        fontWeight="bold"
        position={{ x: W / 2, y: 300 }}
        align="center"
        start={102}
        duration={18}
        strokeColor={GREEN}
      />
      <DrawText
        text="Pen timing"
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
        text="Use it for concepts, processes, and product onboarding."
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
        text="Reproducible video assets"
        fontSize={46}
        fontWeight="bold"
        position={{ x: W / 2, y: 120 }}
        align="center"
        start={0}
        duration={28}
        strokeColor={PURPLE}
      />
      <DrawText
        text="Visuals, narration, captions, and render commands stay in version control."
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
        text="seqvio-render  ->  MP4"
        fontSize={38}
        fontWeight="bold"
        position={{ x: W / 2, y: 392 }}
        align="center"
        start={116}
        duration={26}
        strokeColor={GREEN}
      />
      <DrawText
        text="Seqvio is a structured workflow for explainer videos."
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

export default function SeqvioOverviewEn() {
  return (
    <VideoComposition
      id="seqvio-overview-en"
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
        text: 'Seqvio is a structured workflow for explainer videos. It turns lessons, product walkthroughs, and technical concepts into clear scenes and renderable MP4 files.',
      },
      {
        id: 'workflow',
        sceneId: 'workflow',
        text: 'Instead of starting from a blank animation canvas, Seqvio keeps the script, scenes, narration, and captions together in one composition.',
      },
      {
        id: 'whiteboard',
        sceneId: 'whiteboard',
        text: 'The current visual strength is whiteboard-style explanation: handwritten text, sketch-like shapes, and pen timing for concepts, workflows, and onboarding.',
      },
      {
        id: 'closing',
        sceneId: 'closing',
        text: 'Visuals, voice, captions, and render commands can all live in version control. Seqvio makes explainer videos reproducible, editable, and friendly to AI collaboration.',
      },
    ],
  },
};
