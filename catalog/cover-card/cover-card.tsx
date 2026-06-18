/**
 * cover-card — Whiteboard title card with animated display heading + subtitle.
 * Customise: title, subtitle, start, duration, theme.
 *
 * seqvio-add cover-card
 */

import React from 'react';
import { Scene } from '@seqvio/core';
import { Whiteboard, DrawText } from '@seqvio/whiteboard';

export function CoverCard({
  title = 'Title Goes Here',
  subtitle = 'Subtitle or tagline',
  start = 0,
  duration = 90,
  width = 1920,
  height = 1080,
}: {
  title?: string;
  subtitle?: string;
  start?: number;
  duration?: number;
  width?: number;
  height?: number;
}) {
  return (
    <Scene id="cover" start={start} duration={duration} style={{ background: '#f8f9fb' }}>
      <Whiteboard width={width} height={height}>
        <DrawText
          text={title}
          fontSize={96}
          position={{ x: width / 2, y: height / 2 - 40 }}
          align="center"
          start={0}
          duration={1.2}
        />
        <DrawText
          text={subtitle}
          fontSize={46}
          position={{ x: width / 2, y: height / 2 + 80 }}
          align="center"
          start={1.0}
          duration={0.9}
        />
      </Whiteboard>
    </Scene>
  );
}

export default CoverCard;
