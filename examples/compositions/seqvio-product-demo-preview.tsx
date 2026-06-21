import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { Scene, Transition, VideoComposition } from '@seqvio/core';
import {
  BrowserFrame,
  Callout,
  CursorPath,
  ProductDemoScene,
  ProductTitle,
  ScreenshotPlaceholder,
  productPalette,
} from '@seqvio/product-demo';
import {
  DrawShape,
  DrawText,
  Hand,
  WhiteboardScene,
  getSeqvioStylePreset,
} from '@seqvio/whiteboard';

const W = 1280;
const H = 720;
const FPS = 30;

function PreviewChooserScene() {
  const options = [
    getSeqvioStylePreset('whiteboard/default')!,
    getSeqvioStylePreset('whiteboard/field-note')!,
    getSeqvioStylePreset('whiteboard/studio')!,
  ];
  return (
    <WhiteboardScene width={W} height={H} texture="whiteboard">
      <DrawText
        text="Preview chooser"
        position={{ x: 78, y: 92 }}
        fontSize={60}
        fontWeight="bold"
        start={0}
        duration={30}
      />
      <DrawText
        text="Generate tiny style candidates before committing to a full video."
        position={{ x: 82, y: 154 }}
        fontSize={27}
        strokeColor="#667085"
        start={28}
        duration={35}
      />
      {options.map((style, index) => {
        const x = 92 + index * 374;
        return (
          <React.Fragment key={style.id}>
            <DrawShape
              type="rounded-rectangle"
              position={{ x, y: 230 }}
              size={{ width: 310, height: 300 }}
              fillColor={style.background}
              strokeColor={style.colors.ink}
              strokeWidth={2}
              borderRadius={style.id === 'whiteboard/studio' ? 0 : 10}
              start={65 + index * 12}
              duration={22}
            />
            <DrawShape
              type="rectangle"
              position={{ x: x + 30, y: 270 }}
              size={{ width: 92, height: 18 }}
              fillColor={style.colors.accent}
              strokeColor={style.colors.accent}
              strokeWidth={1}
              start={85 + index * 12}
              duration={16}
            />
            <DrawText
              text={style.name}
              position={{ x: x + 30, y: 355 }}
              fontSize={31}
              fontWeight="bold"
              strokeColor={style.colors.ink}
              start={104 + index * 12}
              duration={24}
            />
            <DrawText
              text={style.density + ' density'}
              position={{ x: x + 30, y: 413 }}
              fontSize={20}
              strokeColor={style.colors.ink}
              start={126 + index * 12}
              duration={22}
            />
          </React.Fragment>
        );
      })}
      <DrawText
        text="Selected: Product Demo"
        position={{ x: 86, y: 642 }}
        fontSize={31}
        fontWeight="bold"
        strokeColor="#2563EB"
        start={174}
        duration={28}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

function ProductWalkthroughScene() {
  return (
    <ProductDemoScene width={W} height={H}>
      <ProductTitle
        title="Product demo scene"
        subtitle="Browser frame, screenshot slot, cursor path, and callouts are now first-class video primitives."
        position={{ x: 70, y: 62 }}
        start={0}
      />
      <BrowserFrame
        position={{ x: 84, y: 238 }}
        width={790}
        height={390}
        url="seqvio.local/render"
        title="Render Console"
        start={35}
      >
        <ScreenshotPlaceholder label="Seqvio Render Queue" start={52} />
      </BrowserFrame>
      <CursorPath
        points={[
          { x: 338, y: 455 },
          { x: 510, y: 410 },
          { x: 705, y: 430 },
          { x: 775, y: 380 },
        ]}
        start={82}
        duration={60}
      />
      <Callout
        text="Focus the viewer on the exact UI moment, then sync narration and captions."
        position={{ x: 914, y: 287 }}
        width={276}
        start={122}
      />
      <div
        style={{
          position: 'absolute',
          left: 914,
          top: 480,
          width: 276,
          height: 94,
          background: productPalette.surface,
          border: `1px solid ${productPalette.line}`,
          padding: 18,
          fontSize: 18,
          lineHeight: 1.35,
          color: productPalette.muted,
        }}
      >
        Next: real screenshots, crop helpers, and recorded UI clips.
      </div>
    </ProductDemoScene>
  );
}

function ClosingScene() {
  return (
    <ProductDemoScene width={W} height={H} background="#101828">
      <div
        style={{
          position: 'absolute',
          left: 78,
          top: 94,
          width: 1120,
          height: 2,
          background: productPalette.accent,
        }}
      />
      <ProductTitle
        title="Four-stage path is now executable"
        subtitle="Style manifest, layout registry, visual QA, and product-demo primitives all render through the same TSX-to-MP4 pipeline."
        position={{ x: 80, y: 180 }}
        start={8}
      />
      <div
        style={{
          position: 'absolute',
          left: 84,
          top: 470,
          color: '#EAF1FF',
          fontSize: 30,
          lineHeight: 1.5,
        }}
      >
        One source-controlled pipeline. More taste. More guardrails.
      </div>
    </ProductDemoScene>
  );
}

export default function SeqvioProductDemoPreview() {
  return (
    <VideoComposition
      id="seqvio-product-demo-preview"
      width={W}
      height={H}
      fps={FPS}
      duration={600}
      backgroundColor="#EEF2F6"
    >
      <Scene id="chooser" duration={215}>
        <PreviewChooserScene />
      </Scene>
      <Transition type="fade" duration={15} />
      <Scene id="walkthrough" duration={220}>
        <ProductWalkthroughScene />
      </Scene>
      <Transition type="fade" duration={15} />
      <Scene id="closing" duration={135}>
        <ClosingScene />
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
