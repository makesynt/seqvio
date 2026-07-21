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

function OpeningScene0() {
  return (
    <TechnicalScene width={W} height={H} annotations={[
  {
    "id": "opening-spot",
    "targetId": "opening-title",
    "kind": "spotlight",
    "start": 0,
    "duration": 120,
    "label": "Hook"
  }
]}>
      <AnnotationTarget id="opening" style={{ width: '100%', height: '100%' }}>
        <WhiteboardScene
          width={W}
          height={H}
          texture={STYLE.texture ?? "whiteboard"}
          background={STYLE.background}
          theme={STYLE.theme ?? excalidrawTheme}
        >
      <DrawText text={"Why requests fail"} position={{ x: 640, y: 220 }} fontSize={52} fontWeight={"bold"} align={"center"} start={0} duration={36} annotationId={"opening-title"} />
      <DrawText text={"Not in the editor — in production"} position={{ x: 640, y: 310 }} fontSize={28} align={"center"} start={24} duration={32} annotationId={"opening-subtitle"} />
      <DrawShape type={"underline"} from={{ x: 380, y: 350 }} to={{ x: 900, y: 350 }} start={40} duration={20} annotationId={"opening-underline"} />
          <Hand action="write" follow={true} visible={true} />
        </WhiteboardScene>
      </AnnotationTarget>
    </TechnicalScene>
  );
}

function LearningGapScene1() {
  return (
    <TechnicalScene width={W} height={H} annotations={[
  {
    "id": "gap-box",
    "targetId": "learning-gap",
    "kind": "box",
    "start": 48,
    "duration": 180,
    "label": "Reframe"
  }
]}>
      <AnnotationTarget id="learning-gap" style={{ width: '100%', height: '100%' }}>
        <WhiteboardScene
          width={W}
          height={H}
          texture={STYLE.texture ?? "whiteboard"}
          background={STYLE.background}
          theme={STYLE.theme ?? excalidrawTheme}
        >
      <DrawText text={"Misconception"} position={{ x: 120, y: 140 }} fontSize={22} start={0} duration={24} strokeColor={"#e74c3c"} />
      <DrawText text={"\"If it builds, the request path is fine\""} position={{ x: 120, y: 200 }} fontSize={34} start={12} duration={40} />
      <DrawShape type={"arrow"} from={{ x: 640, y: 260 }} to={{ x: 640, y: 340 }} start={48} duration={24} />
      <DrawText text={"Better model: trace one request end to end"} position={{ x: 640, y: 400 }} fontSize={30} align={"center"} start={60} duration={36} />
          <Hand action="write" follow={true} visible={true} />
        </WhiteboardScene>
      </AnnotationTarget>
    </TechnicalScene>
  );
}

function SystemMapScene2() {
  return (
    <TechnicalScene width={W} height={H} annotations={[
  {
    "id": "map-gateway",
    "targetId": "sys-gateway",
    "kind": "circle",
    "start": 480,
    "duration": 240,
    "label": "Control point"
  }
]}>
      <ArchitectureDiagram
        id="system-map"
        nodes={[
  {
    "id": "sys-browser",
    "label": "Browser"
  },
  {
    "id": "sys-gateway",
    "label": "API Gateway"
  },
  {
    "id": "sys-auth",
    "label": "Auth",
    "groupId": "edge"
  },
  {
    "id": "sys-users",
    "label": "User Service",
    "groupId": "backend"
  },
  {
    "id": "sys-cache",
    "label": "Redis Cache",
    "groupId": "backend"
  },
  {
    "id": "sys-db",
    "label": "Postgres",
    "groupId": "backend"
  }
]}
        edges={[
  {
    "id": "sys-e1",
    "from": "sys-browser",
    "to": "sys-gateway",
    "label": "HTTPS"
  },
  {
    "id": "sys-e2",
    "from": "sys-gateway",
    "to": "sys-auth",
    "label": "verify JWT"
  },
  {
    "id": "sys-e3",
    "from": "sys-gateway",
    "to": "sys-users",
    "label": "route"
  },
  {
    "id": "sys-e4",
    "from": "sys-users",
    "to": "sys-cache",
    "label": "lookup"
  },
  {
    "id": "sys-e5",
    "from": "sys-users",
    "to": "sys-db",
    "label": "fallback"
  }
]}
        steps={[
  {
    "at": 0,
    "action": "reveal",
    "targetId": "sys-browser"
  },
  {
    "at": 36,
    "action": "reveal",
    "targetId": "sys-gateway"
  },
  {
    "at": 72,
    "action": "connect",
    "edgeId": "sys-e1"
  },
  {
    "at": 120,
    "action": "reveal",
    "targetId": "sys-auth"
  },
  {
    "at": 156,
    "action": "connect",
    "edgeId": "sys-e2"
  },
  {
    "at": 210,
    "action": "reveal",
    "targetId": "sys-users"
  },
  {
    "at": 246,
    "action": "connect",
    "edgeId": "sys-e3"
  },
  {
    "at": 300,
    "action": "reveal",
    "targetId": "sys-cache"
  },
  {
    "at": 336,
    "action": "connect",
    "edgeId": "sys-e4"
  },
  {
    "at": 390,
    "action": "reveal",
    "targetId": "sys-db"
  },
  {
    "at": 426,
    "action": "connect",
    "edgeId": "sys-e5"
  },
  {
    "at": 480,
    "action": "emphasize",
    "targetId": "sys-gateway"
  },
  {
    "at": 600,
    "action": "collapse",
    "groupId": "backend"
  },
  {
    "at": 780,
    "action": "expand",
    "groupId": "backend"
  },
  {
    "at": 900,
    "action": "emphasize",
    "targetId": "sys-users"
  }
]}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}

function ClientCodeScene3() {
  return (
    <TechnicalScene width={W} height={H} annotations={[
  {
    "id": "client-auth",
    "targetId": "client-code",
    "kind": "underline",
    "start": 180,
    "duration": 240,
    "label": "Auth header"
  }
]}>
      <CodeWalkthrough
        id="client-code"
        language="typescript"
        source={"import { apiClient } from './api';\n\nexport async function fetchUser(id: string) {\n  const token = await getSessionToken();\n  return apiClient.get(`/users/${id}`, {\n    headers: { Authorization: `Bearer ${token}` },\n  });\n}\n"}
        steps={[
  {
    "at": 0,
    "action": "focus",
    "range": {
      "startLine": 1,
      "endLine": 8
    }
  },
  {
    "at": 30,
    "action": "focus",
    "range": {
      "startLine": 3,
      "endLine": 3
    }
  },
  {
    "at": 90,
    "action": "type",
    "range": {
      "startLine": 4,
      "endLine": 4
    }
  },
  {
    "at": 180,
    "action": "focus",
    "range": {
      "startLine": 5,
      "endLine": 7
    }
  },
  {
    "at": 240,
    "action": "type",
    "range": {
      "startLine": 5,
      "endLine": 7
    }
  }
]}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}

function HandlerCodeScene4() {
  return (
    <TechnicalScene width={W} height={H} annotations={[]}>
      <CodeWalkthrough
        id="handler-code"
        language="typescript"
        source={"app.get('/users/:id', async (req, res) => {\n  const userId = req.params.id;\n  const cached = await cache.get(`user:${userId}`);\n  if (cached) return res.json(cached);\n\n  const user = await db.users.findById(userId);\n  if (!user) return res.status(404).json({ error: 'not_found' });\n\n  await cache.set(`user:${userId}`, user, { ttl: 60 });\n  return res.json(user);\n});\n"}
        steps={[
  {
    "at": 0,
    "action": "focus",
    "range": {
      "startLine": 1,
      "endLine": 11
    }
  },
  {
    "at": 60,
    "action": "focus",
    "range": {
      "startLine": 3,
      "endLine": 4
    }
  },
  {
    "at": 150,
    "action": "insert",
    "line": 5,
    "text": "  // cache hit path\n"
  },
  {
    "at": 240,
    "action": "focus",
    "range": {
      "startLine": 6,
      "endLine": 7
    }
  },
  {
    "at": 330,
    "action": "focus",
    "range": {
      "startLine": 8,
      "endLine": 9
    }
  },
  {
    "at": 420,
    "action": "replace",
    "range": {
      "startLine": 9,
      "endLine": 9
    },
    "text": "  if (!user) return res.status(404).json({ error: 'not_found' });"
  }
]}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}

function RequestTraceScene5() {
  return (
    <TechnicalScene width={W} height={H} annotations={[]}>
      <ArchitectureDiagram
        id="request-trace"
        nodes={[
  {
    "id": "trace-browser",
    "label": "Browser"
  },
  {
    "id": "trace-gateway",
    "label": "Gateway"
  },
  {
    "id": "trace-users",
    "label": "User Service"
  },
  {
    "id": "trace-cache",
    "label": "Cache"
  },
  {
    "id": "trace-db",
    "label": "Database"
  }
]}
        edges={[
  {
    "id": "trace-in",
    "from": "trace-browser",
    "to": "trace-gateway",
    "label": "GET /users/42"
  },
  {
    "id": "trace-route",
    "from": "trace-gateway",
    "to": "trace-users",
    "label": "authorized"
  },
  {
    "id": "trace-miss",
    "from": "trace-users",
    "to": "trace-cache",
    "label": "miss"
  },
  {
    "id": "trace-read",
    "from": "trace-users",
    "to": "trace-db",
    "label": "SELECT"
  },
  {
    "id": "trace-back",
    "from": "trace-gateway",
    "to": "trace-browser",
    "label": "200 OK"
  }
]}
        steps={[
  {
    "at": 0,
    "action": "reveal",
    "targetId": "trace-browser"
  },
  {
    "at": 24,
    "action": "reveal",
    "targetId": "trace-gateway"
  },
  {
    "at": 48,
    "action": "connect",
    "edgeId": "trace-in"
  },
  {
    "at": 96,
    "action": "reveal",
    "targetId": "trace-users"
  },
  {
    "at": 120,
    "action": "connect",
    "edgeId": "trace-route"
  },
  {
    "at": 168,
    "action": "reveal",
    "targetId": "trace-cache"
  },
  {
    "at": 192,
    "action": "trace",
    "edgeId": "trace-miss"
  },
  {
    "at": 240,
    "action": "reveal",
    "targetId": "trace-db"
  },
  {
    "at": 264,
    "action": "trace",
    "edgeId": "trace-read"
  },
  {
    "at": 330,
    "action": "trace",
    "edgeId": "trace-back"
  },
  {
    "at": 390,
    "action": "emphasize",
    "targetId": "trace-users"
  }
]}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}

function TimeoutFailureScene6() {
  return (
    <TechnicalScene width={W} height={H} annotations={[
  {
    "id": "timeout-label",
    "targetId": "fail-gateway",
    "kind": "arrow",
    "start": 330,
    "duration": 180,
    "label": "504 timeout"
  }
]}>
      <ArchitectureDiagram
        id="timeout-failure"
        nodes={[
  {
    "id": "fail-client",
    "label": "Client"
  },
  {
    "id": "fail-gateway",
    "label": "Gateway"
  },
  {
    "id": "fail-service",
    "label": "User Service"
  },
  {
    "id": "fail-db",
    "label": "Slow DB"
  }
]}
        edges={[
  {
    "id": "fail-call",
    "from": "fail-client",
    "to": "fail-gateway",
    "label": "request"
  },
  {
    "id": "fail-wait",
    "from": "fail-gateway",
    "to": "fail-service",
    "label": "waits"
  },
  {
    "id": "fail-stall",
    "from": "fail-service",
    "to": "fail-db",
    "label": "blocked"
  }
]}
        steps={[
  {
    "at": 0,
    "action": "reveal",
    "targetId": "fail-client"
  },
  {
    "at": 24,
    "action": "reveal",
    "targetId": "fail-gateway"
  },
  {
    "at": 48,
    "action": "connect",
    "edgeId": "fail-call"
  },
  {
    "at": 96,
    "action": "reveal",
    "targetId": "fail-service"
  },
  {
    "at": 120,
    "action": "connect",
    "edgeId": "fail-wait"
  },
  {
    "at": 168,
    "action": "reveal",
    "targetId": "fail-db"
  },
  {
    "at": 192,
    "action": "trace",
    "edgeId": "fail-stall"
  },
  {
    "at": 270,
    "action": "emphasize",
    "targetId": "fail-db"
  },
  {
    "at": 330,
    "action": "emphasize",
    "targetId": "fail-gateway"
  }
]}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}

function CommonPitfallScene7() {
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture={STYLE.texture ?? "whiteboard"}
      background={STYLE.background}
      theme={STYLE.theme ?? excalidrawTheme}
    >
      <DrawText text={"Pitfall"} position={{ x: 120, y: 150 }} fontSize={22} start={0} duration={20} strokeColor={"#e67e22"} />
      <DrawText text={"Client-only logs hide the real failure point"} position={{ x: 120, y: 210 }} fontSize={34} start={12} duration={36} />
      <DrawText text={"Fix: propagate request-id end to end"} position={{ x: 120, y: 300 }} fontSize={30} start={48} duration={32} />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function RecapScene8() {
  return (
    <TechnicalScene width={W} height={H} annotations={[
  {
    "id": "recap-prompt",
    "targetId": "recap",
    "kind": "box",
    "start": 24,
    "duration": 300,
    "label": "Retrieval"
  }
]}>
      <AnnotationTarget id="recap" style={{ width: '100%', height: '100%' }}>
        <WhiteboardScene
          width={W}
          height={H}
          texture={STYLE.texture ?? "whiteboard"}
          background={STYLE.background}
          theme={STYLE.theme ?? excalidrawTheme}
        >
      <DrawText text={"Recap"} position={{ x: 640, y: 180 }} fontSize={48} fontWeight={"bold"} align={"center"} start={0} duration={28} />
      <DrawText text={"1. Where does auth happen?"} position={{ x: 360, y: 280 }} fontSize={28} start={24} duration={28} />
      <DrawText text={"2. When is cache used?"} position={{ x: 360, y: 340 }} fontSize={28} start={48} duration={28} />
      <DrawText text={"3. What does the client see on timeout?"} position={{ x: 360, y: 400 }} fontSize={28} start={72} duration={28} />
          <Hand action="write" follow={true} visible={true} />
        </WhiteboardScene>
      </AnnotationTarget>
    </TechnicalScene>
  );
}

export default function ApiRequestExplainer() {
  return (
    <VideoComposition
      id="api-request-explainer"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor="#ffffff"
      audio={meta.audio}
    >
      <Scene id="opening" duration={540}>
        <OpeningScene0 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="learning-gap" duration={660}>
        <LearningGapScene1 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="system-map" duration={1080}>
        <SystemMapScene2 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="client-code" duration={1320}>
        <ClientCodeScene3 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="handler-code" duration={1320}>
        <HandlerCodeScene4 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="request-trace" duration={1200}>
        <RequestTraceScene5 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="timeout-failure" duration={840}>
        <TimeoutFailureScene6 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="common-pitfall" duration={540}>
        <CommonPitfallScene7 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="recap" duration={540}>
        <RecapScene8 />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 8136,
  width: W,
  height: H,
  audio: {
    fps: FPS,
    lockToAudio: true,
    narration: [
      {
        id: "opening",
        sceneId: "opening",
        text: "Most API bugs are not syntax errors. They are timing and boundary errors that only show up once a real request crosses the network.",
      },
      {
        id: "learning-gap",
        sceneId: "learning-gap",
        text: "A common misconception is that if the client compiles and the server starts, the request path is already correct. In practice you still need to see auth, routing, and downstream latency as one chain.",
      },
      {
        id: "system-map",
        sceneId: "system-map",
        text: "Start with the mental model. A browser calls an API gateway. The gateway authenticates the request, routes it to a service, and the service may call a database or cache before returning a response.",
      },
      {
        id: "client-code",
        sceneId: "client-code",
        text: "On the client, the important detail is not the URL string. It is that every call carries auth context and uses one shared HTTP client so retries, timeouts, and tracing stay consistent.",
      },
      {
        id: "handler-code",
        sceneId: "handler-code",
        text: "On the server, the handler is a decision tree. Check cache first, fall back to the database, return a precise error when the record is missing, and only then write back to cache with a short TTL.",
      },
      {
        id: "request-trace",
        sceneId: "request-trace",
        text: "Now trace the happy path. The request enters the gateway, auth succeeds, the user service misses cache once, reads Postgres, stores the result, and the response returns to the browser.",
      },
      {
        id: "timeout-failure",
        sceneId: "timeout-failure",
        text: "The failure case is just as important. If the database is slow, the handler blocks, the gateway times out, and the client sees a five hundred even though work may still be running downstream.",
      },
      {
        id: "common-pitfall",
        sceneId: "common-pitfall",
        text: "A common pitfall is logging only at the client. Without correlation IDs through gateway and service logs, you cannot reconstruct one request across process boundaries.",
      },
      {
        id: "recap",
        sceneId: "recap",
        text: "Quick recap. Can you explain where auth happens, when cache is consulted, and what the client sees if the database stalls? If you can answer those three, you understand the request path.",
      },
    ],
  },
};
