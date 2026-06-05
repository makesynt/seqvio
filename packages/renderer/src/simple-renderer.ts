/**
 * Simple Renderer
 * Renders whiteboard animations to video using canvas
 */

import { execFile } from 'node:child_process';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

export interface SimpleRenderOptions {
  output: string;
  width?: number;
  height?: number;
  fps?: number;
  totalFrames: number;
  onRenderFrame: (frame: number, ctx: unknown) => void;
}

export async function simpleRender(options: SimpleRenderOptions): Promise<void> {
  const {
    output,
    width = 1920,
    height = 1080,
    fps = 30,
    totalFrames,
    onRenderFrame
  } = options;

  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width, height });

  // Create canvas HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: white;
    }
    canvas {
      display: block;
    }
  </style>
</head>
<body>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    window.renderFrame = function(frame) {
      // Clear canvas
      ctx.clearRect(0, 0, ${width}, ${height});
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, ${width}, ${height});

      // This will be replaced with actual rendering code
      return { success: true };
    };
  </script>
</body>
</html>
  `;

  await page.setContent(html);

  console.log(`🎬 Rendering ${totalFrames} frames...`);

  for (let frame = 0; frame < totalFrames; frame++) {
    // Render frame
    await page.evaluate((f) => {
      const fn = (window as Window & { renderFrame?: (frame: number) => void }).renderFrame;
      if (fn) {
        fn(f);
      }
    }, frame);

    // Capture screenshot
    const framePath = path.join(tempDir, `frame-${String(frame).padStart(6, '0')}.png`);
    await page.screenshot({ path: framePath });

    // Progress
    if (frame % 30 === 0 || frame === totalFrames - 1) {
      const percent = Math.round(((frame + 1) / totalFrames) * 100);
      console.log(`  Frame ${frame + 1}/${totalFrames} (${percent}%)`);
    }
  }

  await browser.close();

  console.log('🎞️  Encoding video...');

  await new Promise<void>((resolve, reject) => {
    const args = [
      '-y',
      '-framerate',
      String(fps),
      '-i',
      path.join(tempDir, 'frame-%06d.png'),
      '-frames:v',
      String(totalFrames),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '18',
      '-preset',
      'medium',
      '-r',
      String(fps),
      output,
    ];

    execFile(ffmpegPath.path, args, { windowsHide: true }, (err, _stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
        return;
      }
      resolve();
    });
  });

  console.log('✅ Done!');
  console.log(`📹 Video: ${output}`);
}
