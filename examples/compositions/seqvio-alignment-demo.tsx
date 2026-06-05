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

function HookScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="Audio-Aligned Scene"
        fontSize={54}
        fontWeight="bold"
        position={{ x: W / 2, y: 210 }}
        align="center"
        start={0}
        duration={24}
        strokeColor="#2563eb"
      />
      <DrawText
        text="One narration cue drives one scene"
        fontSize={26}
        position={{ x: W / 2, y: 282 }}
        align="center"
        start={30}
        duration={20}
        strokeColor="#475569"
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function ProofScene() {
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 220, y: 210 }}
        size={{ width: 820, height: 250 }}
        start={0}
        duration={22}
        strokeColor="#16a34a"
        fillColor="rgba(22,163,74,0.08)"
      />
      <DrawText
        text="Render with audio-manifest.resolved.json"
        fontSize={38}
        fontWeight="bold"
        position={{ x: W / 2, y: 290 }}
        align="center"
        start={26}
        duration={22}
        strokeColor="#166534"
      />
      <DrawText
        text="Scene duration is derived from real synthesized audio"
        fontSize={24}
        position={{ x: W / 2, y: 350 }}
        align="center"
        start={52}
        duration={20}
        strokeColor="#475569"
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export default function SeqvioAlignmentDemo() {
  return (
    <VideoComposition
      id="seqvio-alignment-demo"
      width={W}
      height={H}
      fps={30}
      duration={360}
      backgroundColor="#ffffff"
      audio={meta.audio}
    >
      <Scene id="hook">
        <HookScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="proof">
        <ProofScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  duration: 360,
  fps: 30,
  audio: {
    fps: 30,
    lockToAudio: true,
    narration: [
      {
        id: 'hook-voice',
        sceneId: 'hook',
        text: 'This first scene should last as long as the first narration cue.',
      },
      {
        id: 'proof-voice',
        sceneId: 'proof',
        text: 'After synthesis, the resolved audio manifest drives the second scene duration automatically.',
      },
    ],
  },
};
