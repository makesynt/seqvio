// AUTO-GENERATED from a Seqvio storyboard. Safe to edit by hand.
import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene, Transition } from '@seqvio/core';
import {
  DrawShape,
  DrawText,
  DrawImage,
  DrawIcon,
  Hand,
  WhiteboardScene,
  excalidrawTheme,
  getSeqvioStylePreset,
} from '@seqvio/whiteboard';

const W = 1280;
const H = 720;
const FPS = 30;
const STYLE_ID = "whiteboard/field-note";
const STYLE = getSeqvioStylePreset(STYLE_ID) ?? {
  texture: "none",
  background: "#EFE56A",
  theme: excalidrawTheme,
};

function HookScene0() {
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture={STYLE.texture ?? "none"}
      background={STYLE.background}
      theme={STYLE.theme ?? excalidrawTheme}
    >
      <DrawText text={"Layout registry"} position={{ x: 90, y: 160 }} fontSize={68} fontWeight={"bold"} start={0} duration={36} />
      <DrawText text={"IR now names the visual job before TSX is generated."} position={{ x: 94, y: 236 }} fontSize={30} start={40} duration={42} />
      <DrawShape type={"underline"} from={{ x: 92, y: 278 }} to={{ x: 690, y: 278 }} start={88} duration={24} strokeColor={"#C2342B"} strokeWidth={4} />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function ProcessScene1() {
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture={STYLE.texture ?? "none"}
      background={STYLE.background}
      theme={STYLE.theme ?? excalidrawTheme}
    >
      <DrawText text={"Prompt"} position={{ x: 130, y: 220 }} fontSize={34} fontWeight={"bold"} start={0} duration={24} />
      <DrawShape type={"arrow"} from={{ x: 265, y: 212 }} to={{ x: 460, y: 212 }} start={28} duration={22} strokeWidth={3} />
      <DrawText text={"Layout"} position={{ x: 500, y: 220 }} fontSize={34} fontWeight={"bold"} start={54} duration={24} />
      <DrawShape type={"arrow"} from={{ x: 640, y: 212 }} to={{ x: 835, y: 212 }} start={82} duration={22} strokeWidth={3} />
      <DrawText text={"TSX"} position={{ x: 880, y: 220 }} fontSize={34} fontWeight={"bold"} start={108} duration={24} />
      <DrawText text={"The validator can warn when scene role, density, and layout do not match."} position={{ x: 130, y: 360 }} fontSize={27} start={136} duration={38} />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function TakeawayScene2() {
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture={STYLE.texture ?? "none"}
      background={STYLE.background}
      theme={STYLE.theme ?? excalidrawTheme}
    >
      <DrawShape type={"rounded-rectangle"} position={{ x: 92, y: 115 }} size={{ width: 980, height: 315 }} start={0} duration={30} strokeWidth={3} fillColor={"#F8F1D6"} />
      <DrawText text={"A video scene now has intent, not just coordinates."} position={{ x: 130, y: 245 }} fontSize={48} fontWeight={"bold"} start={36} duration={48} />
      <DrawText text={"That is the bridge from agent planning to reliable visual output."} position={{ x: 132, y: 340 }} fontSize={28} start={88} duration={34} />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export default function StyleLayoutDemo() {
  return (
    <VideoComposition
      id="style-layout-demo"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor="#EFE56A"
    >
      <Scene id="hook" duration={150}>
        <HookScene0 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="process" duration={185}>
        <ProcessScene1 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="takeaway" duration={140}>
        <TakeawayScene2 />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 499,
  width: W,
  height: H,
};
