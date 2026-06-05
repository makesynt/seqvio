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

const width = 1280;
const height = 720;

function AudioDemoScene() {
  return (
    <WhiteboardScene width={width} height={height} texture="whiteboard" theme={excalidrawTheme}>
      <DrawText
        text="Seqvio Audio MVP"
        fontSize={54}
        fontWeight="bold"
        position={{ x: width / 2, y: 160 }}
        align="center"
        start={0}
        duration={26}
        strokeColor="#2563eb"
      />
      <DrawText
        text="旁白、字幕、画面现在可以共用一套时间元数据"
        fontSize={28}
        position={{ x: width / 2, y: 240 }}
        align="center"
        start={24}
        duration={28}
        strokeColor="#334155"
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 230, y: 330 }}
        size={{ width: 260, height: 120 }}
        start={62}
        duration={22}
        strokeColor="#2563eb"
        fillColor="rgba(37, 99, 235, 0.1)"
      />
      <DrawText
        text="TSX Meta"
        fontSize={30}
        fontWeight="bold"
        position={{ x: 360, y: 398 }}
        align="center"
        start={88}
        duration={16}
      />
      <DrawShape
        type="arrow"
        from={{ x: 500, y: 390 }}
        to={{ x: 700, y: 390 }}
        start={106}
        duration={14}
        strokeColor="#16a34a"
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 720, y: 330 }}
        size={{ width: 320, height: 120 }}
        start={124}
        duration={22}
        strokeColor="#16a34a"
        fillColor="rgba(22, 163, 74, 0.1)"
      />
      <DrawText
        text="Audio + Captions"
        fontSize={30}
        fontWeight="bold"
        position={{ x: 880, y: 398 }}
        align="center"
        start={150}
        duration={18}
        strokeColor="#14532d"
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export default function SeqvioAudioDemo() {
  return (
    <VideoComposition
      id="seqvio-audio-demo"
      width={width}
      height={height}
      fps={30}
      duration={180}
      backgroundColor="#ffffff"
      audio={meta.audio}
    >
      <Scene id="audio-demo" duration={180}>
        <AudioDemoScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  duration: 180,
  fps: 30,
  audio: {
    fps: 30,
    duration: 180,
    narration: [
      {
        id: 'intro',
        sceneId: 'audio-demo',
        text: 'Seqvio now accepts shared timing metadata for narration and captions.',
        startFrame: 0,
        endFrame: 60,
      },
      {
        id: 'middle',
        sceneId: 'audio-demo',
        text: 'The renderer can burn captions into frames before muxing audio.',
        startFrame: 60,
        endFrame: 120,
      },
      {
        id: 'outro',
        sceneId: 'audio-demo',
        text: 'That keeps the render pipeline deterministic and offline-friendly.',
        startFrame: 120,
        endFrame: 180,
      },
    ],
    captions: [
      {
        text: 'Seqvio now accepts shared timing metadata for narration and captions.',
        startMs: 0,
        endMs: 2000,
      },
      {
        text: 'The renderer can burn captions into frames before muxing audio.',
        startMs: 2000,
        endMs: 4000,
      },
      {
        text: 'That keeps the render pipeline deterministic and offline-friendly.',
        startMs: 4000,
        endMs: 6000,
      },
    ],
  },
};
