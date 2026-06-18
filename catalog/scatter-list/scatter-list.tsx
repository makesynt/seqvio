/**
 * scatter-list — Scatterbrain pinned sticky-note list for bullet points.
 * Customise: items, colors, title, start, duration.
 *
 * seqvio-add scatter-list
 */

import React from 'react';
import { Scene } from '@seqvio/core';
import { ScatterScene, StickyNote, Scrawl } from '@seqvio/scatterbrain';

const DEFAULT_ITEMS = [
  { text: 'First point', color: '#fef08a' },
  { text: 'Second point', color: '#bfdbfe' },
  { text: 'Third point', color: '#fecdd3' },
  { text: 'Fourth point', color: '#bbf7d0' },
];

export function ScatterList({
  title = 'Key Points',
  items = DEFAULT_ITEMS,
  start = 0,
  duration = 120,
  width = 1920,
  height = 1080,
}: {
  title?: string;
  items?: { text: string; color?: string }[];
  start?: number;
  duration?: number;
  width?: number;
  height?: number;
}) {
  const colW = 380;
  const startX = (width - colW * 2 - 48) / 2;
  const startY = 240;
  const rowH = 220;

  return (
    <Scene id="scatter-list" start={start} duration={duration}>
      <ScatterScene width={width} height={height} background="cork">
        <Scrawl
          text={title}
          fontSize={48}
          position={{ x: width / 2, y: 130 }}
          align="center"
          start={0}
          duration={0.8}
        />
        {items.slice(0, 4).map((item, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          return (
            <StickyNote
              key={i}
              text={item.text}
              color={item.color}
              position={{
                x: startX + col * (colW + 48),
                y: startY + row * rowH,
              }}
              width={colW}
              rotation={(i % 3 === 0 ? 1 : -1) * (1.5 + (i * 0.7) % 2)}
              start={0.4 + i * 0.25}
              duration={0.7}
            />
          );
        })}
      </ScatterScene>
    </Scene>
  );
}

export default ScatterList;
