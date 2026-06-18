/**
 * stat-card — Whiteboard metric highlight card.
 * Shows a large statistic with a label and optional annotation line.
 *
 * seqvio-add stat-card
 */

import React from 'react';
import { Scene } from '@seqvio/core';
import { Whiteboard, DrawText, DrawShape } from '@seqvio/whiteboard';

export function StatCard({
  value = '42%',
  label = 'Metric label',
  annotation = '',
  start = 0,
  duration = 90,
  width = 1920,
  height = 1080,
}: {
  value?: string;
  label?: string;
  annotation?: string;
  start?: number;
  duration?: number;
  width?: number;
  height?: number;
}) {
  const cx = width / 2;
  const cy = height / 2;

  return (
    <Scene id="stat-card" start={start} duration={duration} style={{ background: '#f8f9fb' }}>
      <Whiteboard width={width} height={height}>
        <DrawText
          text={value}
          fontSize={144}
          position={{ x: cx, y: cy - 30 }}
          align="center"
          strokeColor="#3498db"
          start={0}
          duration={1.0}
        />
        <DrawText
          text={label}
          fontSize={46}
          position={{ x: cx, y: cy + 110 }}
          align="center"
          start={0.8}
          duration={0.8}
        />
        <DrawShape
          type="underline"
          position={{ x: cx - 280, y: cy + 140 }}
          size={560}
          start={1.4}
          duration={0.6}
        />
        {annotation ? (
          <DrawText
            text={annotation}
            fontSize={28}
            position={{ x: cx, y: cy + 210 }}
            align="center"
            strokeColor="#7f8c8d"
            start={1.8}
            duration={0.7}
          />
        ) : null}
      </Whiteboard>
    </Scene>
  );
}

export default StatCard;
