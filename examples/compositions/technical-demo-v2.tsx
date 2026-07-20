// AUTO-GENERATED from a Seqvio CompositionDocument v2. Safe to edit by hand.
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
import {
  TechnicalScene,
  AnnotationTarget,
  CodeWalkthrough,
  ArchitectureDiagram,
} from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const STYLE_ID = "whiteboard/default";
const STYLE = getSeqvioStylePreset(STYLE_ID) ?? {
  texture: "whiteboard",
  background: "#ffffff",
  theme: excalidrawTheme,
};

function HookScene0() {
  return (
    <TechnicalScene width={W} height={H} annotations={[
  {
    "id": "hook-frame",
    "targetId": "hook",
    "kind": "spotlight",
    "start": 0,
    "duration": 45,
    "label": "Opening"
  }
]}>
      <AnnotationTarget id="hook" style={{ width: '100%', height: '100%' }}>
        <WhiteboardScene
          width={W}
          height={H}
          texture={STYLE.texture ?? "whiteboard"}
          background={STYLE.background}
          theme={STYLE.theme ?? excalidrawTheme}
        >
      <DrawText text={"Request trace"} position={{ x: 420, y: 280 }} fontSize={56} start={0} duration={30} />
          <Hand action="write" follow={true} visible={true} />
        </WhiteboardScene>
      </AnnotationTarget>
    </TechnicalScene>
  );
}

function CodeStepScene1() {
  return (
    <TechnicalScene width={W} height={H} annotations={[]}>
      <CodeWalkthrough
        id="code-step"
        language="typescript"
        source={"async function fetchUser(id: string) {\n  return api.get(`/users/${id}`);\n}\n"}
        steps={[
  {
    "at": 0,
    "action": "focus",
    "range": {
      "startLine": 1,
      "endLine": 3
    }
  },
  {
    "at": 24,
    "action": "type",
    "range": {
      "startLine": 2,
      "endLine": 2
    }
  }
]}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}

function ArchitectureScene2() {
  return (
    <TechnicalScene width={W} height={H} annotations={[]}>
      <ArchitectureDiagram
        id="architecture"
        nodes={[
  {
    "id": "client",
    "label": "Client"
  },
  {
    "id": "api",
    "label": "API Gateway"
  },
  {
    "id": "service",
    "label": "User Service",
    "groupId": "backend"
  }
]}
        edges={[
  {
    "id": "req",
    "from": "client",
    "to": "api",
    "label": "HTTPS"
  },
  {
    "id": "fwd",
    "from": "api",
    "to": "service",
    "label": "RPC"
  }
]}
        steps={[
  {
    "at": 0,
    "action": "reveal",
    "targetId": "client"
  },
  {
    "at": 18,
    "action": "reveal",
    "targetId": "api"
  },
  {
    "at": 36,
    "action": "connect",
    "edgeId": "req"
  },
  {
    "at": 54,
    "action": "trace",
    "edgeId": "fwd"
  }
]}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}

export default function TechnicalDemo() {
  return (
    <VideoComposition
      id="technical-demo"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor="#ffffff"
      audio={meta.audio}
    >
      <Scene id="hook" duration={48}>
        <HookScene0 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="code-step" duration={132}>
        <CodeStepScene1 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="architecture" duration={162}>
        <ArchitectureScene2 />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 366,
  width: W,
  height: H,
  audio: {
    fps: FPS,
    lockToAudio: true,
    narration: [
      {
        id: "hook",
        sceneId: "hook",
        text: "Today we trace one request through the system.",
      },
      {
        id: "code-step",
        sceneId: "code-step",
        text: "The client calls a typed helper that wraps the HTTP request.",
      },
      {
        id: "architecture",
        sceneId: "architecture",
        text: "The request crosses the gateway before it reaches the user service.",
      },
    ],
  },
};
