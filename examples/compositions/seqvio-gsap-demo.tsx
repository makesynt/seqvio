/**
 * GSAP + Seqvio seekable demo
 *
 * Demonstrates how to drive a paused GSAP timeline from the Seqvio render
 * clock via the SeekableAdapter interface. The GSAP animation and whiteboard
 * strokes share the same timeline and stay in sync at every rendered frame.
 *
 * Usage:
 *   npm install gsap   # one-time; gsap is an optional peer of @seqvio/core
 *   seqvio-render --component examples/compositions/seqvio-gsap-demo.tsx \
 *                 --output output/gsap-demo.mp4 --preset final
 */

import React, { useRef, useMemo } from 'react';
import {
  VideoComposition,
  Scene,
  useCurrentFrame,
  gsapSeekable,
  useSeekable,
} from '@seqvio/core';
import { Whiteboard, DrawText, DrawShape } from '@seqvio/whiteboard';

// Optional: if gsap is not installed this demo will fail at runtime,
// but @seqvio/core itself does not hard-depend on it.
// @ts-ignore
import gsap from 'gsap';

const FPS = 30;
const DURATION = 150; // 5 seconds

function GsapTitle() {
  const frame = useCurrentFrame();
  const boxRef = useRef<HTMLDivElement>(null);

  // Build a paused GSAP timeline once.
  const tl = useMemo(() => {
    const t = gsap.timeline({ paused: true });
    // At time 0s the box is off-screen; by 1.5s it slides and fades in.
    t.fromTo(
      '#gsap-title-box',
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.5, ease: 'power2.out' }
    );
    // At 3s it pulses slightly.
    t.to('#gsap-title-box', { scale: 1.04, duration: 0.3, yoyo: true, repeat: 1 });
    return t;
  }, []);

  // Register this GSAP timeline as a seekable. The renderer will call seek()
  // on every frame, keeping the animation locked to the composition clock.
  useSeekable(gsapSeekable(tl, 'gsap-title'));

  void frame; // frame is consumed indirectly via the seekable mechanism

  return (
    <div
      id="gsap-title-box"
      style={{
        position: 'absolute',
        top: 200,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1a1a2e',
        color: '#e0e0ff',
        padding: '32px 64px',
        borderRadius: 24,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 56,
        fontWeight: 700,
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        opacity: 0,
      }}
    >
      GSAP + Seqvio
    </div>
  );
}

function WhiteboardAnnotation() {
  return (
    <Whiteboard width={1920} height={1080}>
      <DrawText
        text="driven by SeekableAdapter"
        fontSize={36}
        position={{ x: 960, y: 560 }}
        align="center"
        start={1.5}
        duration={1.2}
      />
      <DrawShape
        type="underline"
        position={{ x: 680, y: 580 }}
        size={600}
        start={2.5}
        duration={0.8}
      />
    </Whiteboard>
  );
}

export default function GsapDemo() {
  return (
    <VideoComposition fps={FPS} duration={DURATION} width={1920} height={1080}>
      <Scene
        id="gsap-scene"
        start={0}
        duration={DURATION}
        style={{ background: '#0d0d1a' }}
      >
        <GsapTitle />
        <WhiteboardAnnotation />
      </Scene>
    </VideoComposition>
  );
}
