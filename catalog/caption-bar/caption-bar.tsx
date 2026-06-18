/**
 * caption-bar — Bottom caption bar overlay.
 * Place inside a Scene to show a styled subtitle at the bottom.
 *
 * seqvio-add caption-bar
 */

import React from 'react';
import { useCurrentFrame } from '@seqvio/core';

export interface CaptionCue {
  startFrame: number;
  endFrame: number;
  text: string;
}

export function CaptionBar({
  cues,
  fps = 30,
  bottom = 48,
}: {
  cues: CaptionCue[];
  fps?: number;
  bottom?: number;
}) {
  const frame = useCurrentFrame();
  const active = cues.find((c) => frame >= c.startFrame && frame <= c.endFrame);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      <div
        style={{
          maxWidth: '80%',
          padding: '14px 28px',
          borderRadius: 20,
          background: 'rgba(0, 0, 0, 0.70)',
          color: '#ffffff',
          fontFamily:
            '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", system-ui, sans-serif',
          fontSize: 32,
          fontWeight: 600,
          lineHeight: 1.4,
          textAlign: 'center',
          letterSpacing: 0.3,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        {active.text}
      </div>
    </div>
  );
}

export default CaptionBar;
