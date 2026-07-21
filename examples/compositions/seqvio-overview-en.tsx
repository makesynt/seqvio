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
} from '@seqvio/product-demo';

const W = 1280;
const H = 720;
const FPS = 30;
const TS = typeScale;
const HAND_STACK = 'Virgil, "Segoe Print", "Comic Sans MS", cursive';

// 1 — Intro: cork board, "explainer-video toolchain for the agent era"
function IntroScene() {
  return (
    <ScatterScene surface="cork" style={{ fontFamily: HAND_STACK }}>
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
        text="explainer videos for the agent era"
        position={{ x: 96, y: 348 }}
        fontSize={46}
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
        lessons, product walkthroughs, concepts
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
        scenes, narration, visual intent, timing
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
        <span style={{ fontFamily: HAND_STACK, fontSize: 62, color: palette.ink }}>
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

// 2 — Whiteboard style: real @seqvio/whiteboard hand-drawn scene
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
        text="handwritten text, sketch shapes, pen timing"
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
        text="concept"
        position={{ x: 226, y: 322 }}
        align="center"
        fontSize={30}
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
        text="workflow"
        position={{ x: 610, y: 322 }}
        align="center"
        fontSize={30}
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
        text="explain one thing, step by step"
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

// 3 — Sticky-note / workshop style: @seqvio/scatterbrain
function ScatterStyleScene() {
  return (
    <ScatterScene surface="warm" style={{ fontFamily: HAND_STACK }}>
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
        items={['sticky-note board', 'handwritten keywords', 'arrows and circles', 'ideas -> explainer']}
        position={{ x: 76, y: 190 }}
        itemWidth={380}
        start={28}
        stagger={14}
      />

      <Polaroid
        caption="preview frame"
        position={{ x: 605, y: 128 }}
        width={312}
        rotate={4}
        fill="linear-gradient(135deg, #bfdbfe, #fef3c7)"
        start={48}
        duration={16}
      >
        <span style={{ fontFamily: HAND_STACK, fontSize: 50, color: palette.ink }}>
          scene 01
        </span>
      </Polaroid>
      <StickyNote
        title="workshop"
        position={{ x: 878, y: 300 }}
        width={318}
        color="blue"
        rotate={-3}
        attach="pin"
        pinColor="blue"
        start={72}
        duration={16}
      >
        cork, notes, and doodles for brainstorming.
      </StickyNote>
      <StickyNote
        title="one pipeline"
        position={{ x: 560, y: 498 }}
        width={340}
        color="pink"
        rotate={-2}
        attach="tape"
        start={104}
        duration={16}
      >
        Different look, same timing, narration, and render contract.
      </StickyNote>
      <Doodle
        type="arrow"
        position={{ x: 490, y: 360 }}
        size={135}
        color={palette.ink}
        rotate={-18}
        start={120}
        duration={20}
      />
      <Doodle
        type="squiggle"
        position={{ x: 1060, y: 95 }}
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

// 4 — Product-demo style + deterministic workflow: @seqvio/product-demo
function WorkflowScene() {
  return (
    <ProductDemoScene
      width={W}
      height={H}
      background="#EEF2F6"
      style={{ fontFamily: HAND_STACK }}
    >
      <ProductTitle
        title="@seqvio/product-demo"
        subtitle="Agent produces structure; renderer validates, aligns narration, renders locally."
        position={{ x: 64, y: 56 }}
        start={0}
      />

      <BrowserFrame
        position={{ x: 70, y: 232 }}
        width={730}
        height={396}
        url="seqvio.local/workflow"
        title="Seqvio Render Console"
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
        text="Storyboard IR is generated, validated, repaired, and compiled deterministically."
        position={{ x: 848, y: 262 }}
        width={318}
        start={118}
      />
      <Callout
        text="Voice is the clock: narration.wav drives scene duration."
        position={{ x: 892, y: 438 }}
        width={300}
        start={152}
        accent="#F97316"
      />
    </ProductDemoScene>
  );
}

// 5 — Closing: everything in version control, deterministic and reproducible
function ClosingScene() {
  return (
    <ProductDemoScene
      width={W}
      height={H}
      background="#101828"
      style={{ fontFamily: HAND_STACK }}
    >
      <div
        style={{
          position: 'absolute',
          left: 72,
          top: 70,
          fontFamily: HAND_STACK,
          color: '#F8FAFC',
        }}
      >
        <div style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 850 }}>
          Deterministic, reproducible video assets
        </div>
        <div
          style={{
            marginTop: 18,
            maxWidth: 620,
            fontSize: 24,
            lineHeight: 1.35,
            color: '#B7C8E6',
          }}
        >
          Visuals, narration, captions, QA, and render commands all live in version control.
        </div>
      </div>
      <BrowserFrame
        position={{ x: 70, y: 268 }}
        width={620}
        height={300}
        url="repo/seqvio/examples/compositions"
        title="Versioned source"
        start={34}
        style={{ boxShadow: '0 22px 60px rgba(0,0,0,0.35)' }}
      >
        <div style={{ padding: 28, fontSize: 18 }}>
          <div style={{ color: '#2563EB' }}>examples/compositions/</div>
          <div style={{ marginTop: 16 }}>seqvio-overview-en.tsx</div>
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
        text="seqvio-render fuses TSX, the CosyVoice track, and local rendering into one MP4."
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
          fontFamily: HAND_STACK,
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

export default function SeqvioOverviewEn() {
  return (
    <VideoComposition
      id="seqvio-overview-en"
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
      <Scene id="intro" duration={387}>
        <IntroScene />
      </Scene>
      <Scene id="whiteboard" duration={320}>
        <WhiteboardStyleScene />
      </Scene>
      <Scene id="scatterbrain" duration={307}>
        <ScatterStyleScene />
      </Scene>
      <Scene id="workflow" duration={379}>
        <WorkflowScene />
      </Scene>
      <Scene id="closing" duration={356}>
        <ClosingScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  duration: 1749,
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
        text: 'Seqvio is an explainer-video toolchain for the agent era. It turns lessons, product walkthroughs, and technical concepts into clear scenes, and renders them locally and deterministically into a deliverable MP4.',
      },
      {
        id: 'whiteboard',
        sceneId: 'whiteboard',
        text: 'Seqvio gets its visuals from several style packages. The whiteboard package gives you handwritten text, sketch-like shapes, and pen timing, ideal for explaining a concept or a workflow step by step.',
      },
      {
        id: 'scatterbrain',
        sceneId: 'scatterbrain',
        text: 'The scatterbrain package adds sticky-note and cork-board workshop scenes for brainstorming and shaping ideas. Different look, but the same timing, narration, and rendering contracts.',
      },
      {
        id: 'workflow',
        sceneId: 'workflow',
        text: 'The product-demo package covers product walkthroughs. The whole flow is deterministic: an agent produces the structured storyboard, and the renderer validates it, aligns narration, and renders locally, so the visuals follow the synthesized voice.',
      },
      {
        id: 'closing',
        sceneId: 'closing',
        text: 'In the end, visuals, narration, captions, visual QA, and render commands all live in version control. Seqvio makes explainer videos deterministic, reproducible, and friendly to AI collaboration.',
      },
    ],
  },
};
