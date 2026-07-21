import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { render } from '@seqvio/renderer';
import type { PipelineProgress, RecordingManifest } from './types';

function quote(value: string): string {
  return JSON.stringify(value);
}

export function writeComposition(manifest: RecordingManifest, jobDir: string): string {
  const componentPath = path.join(jobDir, 'composition.tsx');
  const manifestPath = path.join(jobDir, 'recording-manifest.json').replace(/\\/g, '/');
  const sourceUrl = pathToFileURL(manifest.sourceVideo).href;
  const duration = Math.max(1, Math.ceil((manifest.durationMs / 1000) * manifest.renderFps));
  const source = `import React from 'react';
import { VideoComposition } from '@seqvio/core';
import { RecordedBrowserDemo } from '@seqvio/product-demo';
import recording from ${quote(manifestPath)};

const FPS = ${manifest.renderFps};
const DURATION = ${duration};

export default function BrowserRecording() {
  return (
    <VideoComposition
      id="browser-recording-${Date.now()}"
      width={recording.recordingWidth}
      height={recording.recordingHeight}
      fps={FPS}
      duration={DURATION}
      backgroundColor="#0B0F17"
    >
      <RecordedBrowserDemo
        src=${quote(sourceUrl)}
        recordingWidth={recording.recordingWidth}
        recordingHeight={recording.recordingHeight}
        width={recording.recordingWidth}
        height={recording.recordingHeight}
        fps={FPS}
        maxZoom={recording.maxZoom}
        focusTargets={recording.focusTargets}
        cursorPoints={recording.cursorPoints}
        clicks={recording.clicks}
      />
    </VideoComposition>
  );
}

export const meta = {
  fps: FPS,
  duration: DURATION,
  width: recording.recordingWidth,
  height: recording.recordingHeight,
};
`;
  fs.writeFileSync(componentPath, source, 'utf8');
  return componentPath;
}

export async function renderRecording(
  manifest: RecordingManifest,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
): Promise<string> {
  onProgress?.({ phase: 'composing', percent: 76, message: 'Generating Seqvio composition' });
  const component = writeComposition(manifest, jobDir);
  const output = path.join(jobDir, 'final.mp4');
  await render({
    component,
    output,
    width: manifest.recordingWidth,
    height: manifest.recordingHeight,
    fps: manifest.renderFps,
    quality: 'medium',
    pixelRatio: 1,
    frameFormat: 'jpeg',
    jpegQuality: 88,
    workers: 1,
  }, (renderProgress) => {
    const percent = renderProgress.percent ?? 0;
    onProgress?.({
      phase: 'rendering',
      percent: 78 + Math.round(percent * 0.21),
      message: renderProgress.message,
    });
  });
  return output;
}
