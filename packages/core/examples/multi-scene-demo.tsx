/**
 * Multi-scene composition demo with fade transitions
 */

import React from 'react';
import { VideoComposition, Scene, Transition } from '../src/composition';
import {
  WhiteboardScene,
  DrawText,
  DrawShape,
  Hand,
} from '@seqvio/whiteboard';

function IntroScene() {
  return (
    <WhiteboardScene width={1280} height={720} texture="paper">
      <DrawText
        text="Seqvio"
        fontSize={64}
        fontWeight="bold"
        position={{ x: 640, y: 280 }}
        align="center"
        start={0}
        duration={50}
      />
      <DrawText
        text="Multi-scene demo"
        fontSize={32}
        position={{ x: 640, y: 360 }}
        align="center"
        start={20}
        duration={40}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function FeatureScene() {
  return (
    <WhiteboardScene width={1280} height={720} texture="paper">
      <DrawShape
        type="rectangle"
        position={{ x: 340, y: 220 }}
        size={{ width: 600, height: 280 }}
        start={0}
        duration={40}
        strokeColor="#3498db"
      />
      <DrawText
        text="Scene Registry + Transitions"
        fontSize={42}
        fontWeight="bold"
        position={{ x: 640, y: 360 }}
        align="center"
        start={15}
        duration={45}
        strokeColor="#2c3e50"
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function OutroScene() {
  return (
    <WhiteboardScene width={1280} height={720} texture="paper">
      <DrawText
        text="Render Complete"
        fontSize={56}
        fontWeight="bold"
        position={{ x: 640, y: 320 }}
        align="center"
        start={0}
        duration={50}
        strokeColor="#27ae60"
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export default function MultiSceneDemo() {
  return (
    <VideoComposition
      id="multi-scene-demo"
      width={1280}
      height={720}
      fps={30}
      duration={195}
      backgroundColor="#ffffff"
    >
      <Scene id="intro" duration={60}>
        <IntroScene />
      </Scene>
      <Transition type="fade" duration={15} />
      <Scene id="feature" duration={60}>
        <FeatureScene />
      </Scene>
      <Transition type="fade" duration={15} />
      <Scene id="outro" duration={45}>
        <OutroScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta = {
  duration: 195,
  fps: 30,
};
