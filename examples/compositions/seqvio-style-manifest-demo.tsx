import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { Scene, Transition, VideoComposition } from '@seqvio/core';
import {
  DrawShape,
  DrawText,
  Hand,
  WhiteboardScene,
  getSeqvioStylePreset,
  listSeqvioStylePresets,
} from '@seqvio/whiteboard';

const W = 1280;
const H = 720;
const FPS = 30;

function styleOrThrow(id: string) {
  const preset = getSeqvioStylePreset(id);
  if (!preset) throw new Error(`Missing Seqvio style preset: ${id}`);
  return preset;
}

function ManifestOverview() {
  const styles = listSeqvioStylePresets();
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard">
      <DrawText
        text="Style manifest"
        position={{ x: 80, y: 98 }}
        fontSize={64}
        fontWeight="bold"
        start={0}
        duration={28}
      />
      <DrawText
        text="Choose visual intent before drawing a video."
        position={{ x: 82, y: 166 }}
        fontSize={28}
        strokeColor="#5f6f7a"
        start={28}
        duration={28}
      />
      {styles.slice(0, 4).map((style, index) => {
        const x = 92 + index * 292;
        return (
          <React.Fragment key={style.id}>
            <DrawShape
              type="rounded-rectangle"
              position={{ x, y: 275 }}
              size={{ width: 238, height: 250 }}
              fillColor={style.background}
              strokeColor={style.colors.ink}
              strokeWidth={2}
              borderRadius={style.id === 'whiteboard/studio' ? 0 : 12}
              start={62 + index * 10}
              duration={20}
            />
            <DrawShape
              type="rectangle"
              position={{ x: x + 22, y: 305 }}
              size={{ width: 56, height: 12 }}
              fillColor={style.colors.accent}
              strokeColor={style.colors.accent}
              strokeWidth={1}
              start={78 + index * 10}
              duration={12}
            />
            <DrawText
              text={style.name}
              position={{ x: x + 22, y: 370 }}
              fontSize={26}
              fontWeight="bold"
              strokeColor={style.colors.ink}
              start={92 + index * 10}
              duration={20}
            />
            <DrawText
              text={style.mood.slice(0, 3).join(' / ')}
              position={{ x: x + 22, y: 422 }}
              fontSize={17}
              strokeColor={style.colors.ink}
              start={112 + index * 10}
              duration={22}
            />
          </React.Fragment>
        );
      })}
      <DrawText
        text="Metadata drives style matching; TSX still owns production."
        position={{ x: 84, y: 640 }}
        fontSize={25}
        strokeColor="#2c3e50"
        start={166}
        duration={32}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function FieldNoteScene() {
  const style = styleOrThrow('whiteboard/field-note');
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture={style.texture}
      background={style.background}
      theme={style.theme}
    >
      <DrawShape
        type="rectangle"
        position={{ x: 86, y: 82 }}
        size={{ width: 460, height: 405 }}
        fillColor={style.colors.surface}
        strokeColor={style.colors.ink}
        strokeWidth={3}
        start={0}
        duration={28}
      />
      <DrawText
        text="Field Note"
        position={{ x: 126, y: 165 }}
        fontSize={style.typeScale.h1}
        fontWeight="bold"
        strokeColor={style.colors.ink}
        start={28}
        duration={30}
      />
      <DrawText
        text="research recap"
        position={{ x: 130, y: 230 }}
        fontSize={style.typeScale.body}
        strokeColor={style.colors.accent}
        start={60}
        duration={24}
      />
      <DrawShape
        type="underline"
        from={{ x: 128, y: 260 }}
        to={{ x: 428, y: 260 }}
        strokeColor={style.colors.accent}
        strokeWidth={4}
        start={86}
        duration={22}
      />
      <DrawText
        text="Use when a video should feel grounded, tactile, and organized."
        position={{ x: 666, y: 215 }}
        fontSize={34}
        strokeColor={style.colors.ink}
        start={110}
        duration={48}
      />
      <DrawText
        text="Scene plans can now carry styleId, density, and occasion."
        position={{ x: 666, y: 344 }}
        fontSize={25}
        strokeColor={style.colors.ink}
        start={158}
        duration={42}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function StudioScene() {
  const style = styleOrThrow('whiteboard/studio');
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture={style.texture}
      background={style.background}
      theme={style.theme}
    >
      <DrawShape
        type="line"
        from={{ x: 72, y: 88 }}
        to={{ x: 1210, y: 88 }}
        strokeColor={style.colors.accent}
        strokeWidth={2}
        start={0}
        duration={18}
      />
      <DrawText
        text="STUDIO"
        position={{ x: 70, y: 248 }}
        fontSize={136}
        fontWeight="bold"
        strokeColor={style.colors.ink}
        start={22}
        duration={34}
      />
      <DrawText
        text="One accent. One mood. No generic defaults."
        position={{ x: 80, y: 340 }}
        fontSize={34}
        strokeColor="rgba(245,210,0,0.62)"
        start={62}
        duration={36}
      />
      <DrawShape
        type="rectangle"
        position={{ x: 85, y: 445 }}
        size={{ width: 980, height: 74 }}
        fillColor={style.colors.accent}
        strokeColor={style.colors.accent}
        strokeWidth={1}
        start={104}
        duration={24}
      />
      <DrawText
        text="Style becomes a contract before frames are rendered."
        position={{ x: 112, y: 493 }}
        fontSize={28}
        fontWeight="bold"
        strokeColor="#1C1C1C"
        start={132}
        duration={36}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export default function SeqvioStyleManifestDemo() {
  return (
    <VideoComposition
      id="seqvio-style-manifest-demo"
      width={W}
      height={H}
      fps={FPS}
      duration={600}
      backgroundColor="#f8f9fb"
    >
      <Scene id="manifest" duration={210}>
        <ManifestOverview />
      </Scene>
      <Transition type="fade" duration={15} />
      <Scene id="field-note" duration={185}>
        <FieldNoteScene />
      </Scene>
      <Transition type="fade" duration={15} />
      <Scene id="studio" duration={175}>
        <StudioScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 600,
  width: W,
  height: H,
};
