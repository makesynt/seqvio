/**

 * Seqvio framework intro — handwritten TSX (4 scenes, single-pen serialization).

 */



import React from 'react';

import { VideoComposition, Scene, Transition } from '@seqvio/core';

import {

  WhiteboardScene,

  DrawText,

  DrawShape,

  Hand,

  excalidrawTheme,

} from '@seqvio/whiteboard';



const W = 1280;

const H = 720;

const ACCENT = '#3498db';

const ACCENT2 = '#27ae60';

const MUTED = '#7f8c8d';

const CTA = '#e74c3c';



function TitleScene() {

  return (

    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>

      <DrawText

        text="PROGRAMMATIC VIDEO"

        fontSize={14}

        fontWeight="bold"

        position={{ x: W / 2, y: 200 }}

        align="center"

        start={0}

        duration={24}

        strokeColor={ACCENT}

      />

      <DrawText

        text="Seqvio"

        fontSize={52}

        fontWeight="bold"

        position={{ x: W / 2, y: 280 }}

        align="center"

        start={0}

        duration={28}

      />

      <DrawText

        text="Structured content → explainer MP4"

        fontSize={22}

        position={{ x: W / 2, y: 350 }}

        align="center"

        start={0}

        duration={20}

        strokeColor={MUTED}

      />

      <DrawText

        text="程序化视频 · 手绘可编程"

        fontSize={24}

        position={{ x: W / 2, y: 388 }}

        align="center"

        start={0}

        duration={22}

        strokeColor={MUTED}

      />

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 320, y: 420 }}

        size={{ width: 90, height: 70 }}

        start={0}

        duration={16}

        fillColor="#ffffff"

      />

      <DrawText

        text="TSX"

        fontSize={14}

        fontWeight="bold"

        position={{ x: 365, y: 462 }}

        align="center"

        start={0}

        duration={12}

      />

      <DrawShape

        type="arrow"

        from={{ x: 420, y: 455 }}

        to={{ x: 500, y: 455 }}

        start={0}

        duration={12}

        strokeColor={ACCENT}

      />

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 510, y: 420 }}

        size={{ width: 90, height: 70 }}

        start={0}

        duration={12}

        fillColor="#ffffff"

      />

      <DrawText

        text="Render"

        fontSize={13}

        fontWeight="bold"

        position={{ x: 555, y: 462 }}

        align="center"

        start={0}

        duration={10}

      />

      <DrawShape

        type="arrow"

        from={{ x: 610, y: 455 }}

        to={{ x: 690, y: 455 }}

        start={0}

        duration={10}

        strokeColor={ACCENT2}

      />

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 700, y: 408 }}

        size={{ width: 44, height: 84 }}

        start={0}

        duration={10}

        strokeColor={ACCENT2}

        fillColor="rgba(39,174,96,0.15)"

      />

      <DrawText

        text="MP4"

        fontSize={12}

        fontWeight="bold"

        position={{ x: 722, y: 462 }}

        align="center"

        start={0}

        duration={10}

        strokeColor={ACCENT2}

      />

      <Hand action="write" follow={true} visible={true} />

    </WhiteboardScene>

  );

}



function PipelineScene() {

  const steps = ['TSX Composition', 'Bundle & validate', 'Render MP4'];

  return (

    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>

      <DrawText

        text="CORE PIPELINE"

        fontSize={16}

        fontWeight="bold"

        position={{ x: 200, y: 180 }}

        align="left"

        start={0}

        duration={28}

        strokeColor={ACCENT}

      />

      {steps.map((label, i) => (

        <React.Fragment key={label}>

          <DrawShape

            type="circle"

            position={{ x: 120, y: 250 + i * 70 }}

            size={44}

            start={0}

            duration={14}

            strokeColor={i === 2 ? ACCENT2 : ACCENT}

            fillColor={i === 2 ? ACCENT2 : ACCENT}

          />

          <DrawText

            text={String(i + 1)}

            fontSize={18}

            fontWeight="bold"

            position={{ x: 120, y: 258 + i * 70 }}

            align="center"

            start={0}

            duration={12}

            strokeColor="#ffffff"

            textRender="stroke"

          />

          <DrawText

            text={label}

            fontSize={28}

            fontWeight="bold"

            position={{ x: 180, y: 250 + i * 70 }}

            align="left"

            start={0}

            duration={16}

          />

        </React.Fragment>

      ))}

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 720, y: 380 }}

        size={{ width: 90, height: 70 }}

        start={0}

        duration={14}

        fillColor="#ffffff"

      />

      <DrawShape

        type="arrow"

        from={{ x: 820, y: 415 }}

        to={{ x: 900, y: 415 }}

        start={0}

        duration={12}

        strokeColor={ACCENT}

      />

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 910, y: 380 }}

        size={{ width: 90, height: 70 }}

        start={0}

        duration={12}

        fillColor="#ffffff"

      />

      <DrawShape

        type="arrow"

        from={{ x: 1010, y: 415 }}

        to={{ x: 1080, y: 415 }}

        start={0}

        duration={10}

        strokeColor={ACCENT2}

      />

      <DrawText

        text="MP4"

        fontSize={12}

        fontWeight="bold"

        position={{ x: 1110, y: 422 }}

        align="center"

        start={0}

        duration={10}

        strokeColor={ACCENT2}

      />

      <Hand action="write" follow={true} visible={true} />

    </WhiteboardScene>

  );

}



function FeatureScene() {

  return (

    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 280, y: 200 }}

        size={{ width: 720, height: 320 }}

        start={0}

        duration={22}

        strokeColor={ACCENT2}

      />

      <DrawText

        text="AI-Agent Ready"

        fontSize={40}

        fontWeight="bold"

        position={{ x: W / 2, y: 300 }}

        align="center"

        start={0}

        duration={20}

        strokeColor={ACCENT2}

      />

      <DrawText

        text="Whiteboard · TSX · Frame-accurate pipeline"

        fontSize={22}

        position={{ x: W / 2, y: 360 }}

        align="center"

        start={0}

        duration={18}

      />

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 300, y: 400 }}

        size={{ width: 200, height: 36 }}

        start={0}

        duration={12}

        fillColor="rgba(52,152,219,0.12)"

        strokeColor={ACCENT}

      />

      <DrawText

        text="@seqvio/whiteboard"

        fontSize={14}

        fontWeight="bold"

        position={{ x: 400, y: 420 }}

        align="center"

        start={0}

        duration={12}

      />

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 540, y: 400 }}

        size={{ width: 200, height: 36 }}

        start={0}

        duration={12}

        fillColor="rgba(44,62,80,0.08)"

      />

      <DrawText

        text="esbuild + Puppeteer"

        fontSize={14}

        fontWeight="bold"

        position={{ x: 640, y: 420 }}

        align="center"

        start={0}

        duration={12}

      />

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 780, y: 400 }}

        size={{ width: 200, height: 36 }}

        start={0}

        duration={12}

        fillColor="rgba(44,62,80,0.08)"

      />

      <DrawText

        text="Handwritten TSX"

        fontSize={14}

        fontWeight="bold"

        position={{ x: 880, y: 420 }}

        align="center"

        start={0}

        duration={12}

      />

      <Hand action="write" follow={true} visible={true} />

    </WhiteboardScene>

  );

}



function CtaScene() {

  return (

    <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>

      <DrawShape

        type="rounded-rectangle"

        position={{ x: 340, y: 260 }}

        size={{ width: 600, height: 200 }}

        start={0}

        duration={20}

        strokeColor={CTA}

        fillColor="none"

      />

      <DrawText

        text="Start Building Today"

        fontSize={44}

        fontWeight="bold"

        position={{ x: W / 2, y: 340 }}

        align="center"

        start={0}

        duration={22}

        strokeColor={CTA}

      />

      <DrawText

        text="seqvio · MIT License"

        fontSize={18}

        position={{ x: W / 2, y: 400 }}

        align="center"

        start={0}

        duration={16}

      />

      <Hand action="write" follow={true} visible={true} />

    </WhiteboardScene>

  );

}



export default function SeqvioIntro() {

  return (

    <VideoComposition

      id="seqvio-intro"

      width={W}

      height={H}

      fps={30}

      duration={636}

      backgroundColor="#ffffff"

    >

      <Scene id="title" duration={190}>

        <TitleScene />

      </Scene>

      <Transition type="fade" duration={12} />

      <Scene id="pipeline" duration={212}>

        <PipelineScene />

      </Scene>

      <Transition type="fade" duration={12} />

      <Scene id="features" duration={136}>

        <FeatureScene />

      </Scene>

      <Transition type="fade" duration={12} />

      <Scene id="cta" duration={62}>

        <CtaScene />

      </Scene>

    </VideoComposition>

  );

}



export const meta = {

  duration: 636,

  fps: 30,

};


