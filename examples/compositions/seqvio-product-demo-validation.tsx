import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition } from '@seqvio/core';
import {
  BrowserFrame,
  Callout,
  CursorPath,
  ProductDemoScene,
  ProductTitle,
  ScreenshotPlaceholder,
  productPalette,
} from '@seqvio/product-demo';

const W = 1280;
const H = 720;
const FPS = 30;
const DURATION = 120;

function ValidationScene() {
  return (
    <ProductDemoScene width={W} height={H} background="#EEF2F6">
      <ProductTitle
        title="Seqvio product demo"
        subtitle="A focused validation render for browser frames, cursor motion, screenshot slots, and callouts."
        position={{ x: 70, y: 58 }}
        start={0}
      />
      <BrowserFrame
        position={{ x: 78, y: 230 }}
        width={820}
        height={410}
        url="seqvio.local/workflows/product-demo"
        title="Seqvio Render Console"
        start={10}
        duration={12}
      >
        <ScreenshotPlaceholder label="Seqvio Render Queue" start={22} duration={12} />
      </BrowserFrame>
      <CursorPath
        points={[
          { x: 335, y: 450 },
          { x: 485, y: 405 },
          { x: 665, y: 430 },
          { x: 785, y: 382 },
        ]}
        start={42}
        duration={46}
        color={productPalette.accent2}
      />
      <Callout
        text="This validates @seqvio/product-demo inside the real TSX-to-MP4 renderer."
        position={{ x: 934, y: 260 }}
        width={282}
        start={64}
        duration={12}
        accent={productPalette.accent2}
      />
      <div
        style={{
          position: 'absolute',
          left: 934,
          top: 456,
          width: 282,
          height: 118,
          background: productPalette.surface,
          border: `1px solid ${productPalette.line}`,
          boxShadow: `0 14px 34px ${productPalette.shadow}`,
          padding: 18,
          fontSize: 18,
          lineHeight: 1.35,
          color: productPalette.muted,
          opacity: 0.95,
        }}
      >
        Components covered: scene, title, browser frame, screenshot slot,
        cursor path, callout, palette.
      </div>
    </ProductDemoScene>
  );
}

export default function SeqvioProductDemoValidation() {
  return (
    <VideoComposition
      id="seqvio-product-demo-validation"
      width={W}
      height={H}
      fps={FPS}
      duration={DURATION}
      backgroundColor="#EEF2F6"
    >
      <ValidationScene />
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: DURATION,
  width: W,
  height: H,
};
