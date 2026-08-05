import React from 'react';
import { AnnotationTarget, useComposition, useCurrentFrame, type ExplanationBeatTiming } from '@seqvio/core';

export interface ManimMarker {
  id: string;
  frame: number;
  targetId?: string;
  beatId?: string;
}

export interface ManimClipProps {
  id: string;
  src: string;
  width?: number;
  height?: number;
  fps?: number;
  markers?: ManimMarker[];
  background?: string;
  fit?: 'contain' | 'cover' | 'fill';
}

export function markerAtFrame(markers: ManimMarker[], frame: number): ManimMarker | undefined {
  return [...markers].sort((a, b) => a.frame - b.frame).filter((marker) => marker.frame <= frame).at(-1);
}

export function resolveManimMarkerFrames(markers: ManimMarker[], beats: ExplanationBeatTiming[] = [], sceneId?: string): ManimMarker[] {
  return markers.map((marker) => {
    if (!marker.beatId) return marker;
    const qualified = sceneId ? `${sceneId}.${marker.beatId}` : marker.beatId;
    const beat = beats.find((item) => item.id === qualified || item.id === marker.beatId);
    return beat ? { ...marker, frame: beat.outputFrame ?? beat.sourceFrame } : marker;
  });
}

export function ManimClip({
  id, src, width = 1280, height = 720, fps = 30, markers = [],
  background = '#0f172a', fit = 'contain',
}: ManimClipProps) {
  const frame = useCurrentFrame();
  const { config } = useComposition();
  const resolvedMarkers = resolveManimMarkerFrames(markers, config.audio?.explanationBeats, id);
  const marker = markerAtFrame(resolvedMarkers, frame);
  return (
    <AnnotationTarget id={id} style={{ position: 'relative', width, height }}>
      <div
        data-seqvio-manim-clip={id}
        data-seqvio-manim-marker={marker?.id ?? ''}
        data-seqvio-manim-frame={frame}
        style={{ position: 'relative', width, height, overflow: 'hidden', background }}
      >
        <video
          data-seqvio-seekable-media="true"
          data-seqvio-media-frame={frame}
          data-seqvio-media-fps={fps}
          src={src}
          muted
          preload="auto"
          playsInline
          style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
        />
        {marker?.targetId ? (
          <AnnotationTarget id={marker.targetId} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <span />
          </AnnotationTarget>
        ) : null}
      </div>
    </AnnotationTarget>
  );
}
