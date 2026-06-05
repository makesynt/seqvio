/**
 * Render the framework intro video
 * Simple script to test the renderer
 */

import { render, RenderProgress } from './renderer';
import * as path from 'path';

async function renderFrameworkIntro() {
  console.log('🎬 Starting video render...\n');

  const outputPath = path.join(process.cwd(), 'output', 'framework-intro.mp4');
  const componentPath = path.resolve(
    __dirname,
    '../../whiteboard/examples/04-framework-intro.tsx'
  );

  try {
    await render(
      {
        component: componentPath,
        output: outputPath,
        width: 1920,
        height: 1080,
        fps: 30,
        quality: 'high',
        tempDir: path.join(process.cwd(), 'temp'),
        keepFrames: false
      },
      (progress: RenderProgress) => {
        // Progress callback
        if (progress.percent !== undefined) {
          const bar = '█'.repeat(Math.floor(progress.percent / 2)) +
                     '░'.repeat(50 - Math.floor(progress.percent / 2));
          process.stdout.write(`\r[${bar}] ${progress.percent}% - ${progress.message}`);
        }
      }
    );

    console.log('\n\n✅ Render complete!');
    console.log(`📹 Video saved to: ${outputPath}`);
  } catch (error) {
    console.error('\n\n❌ Render failed:', error);
    process.exit(1);
  }
}

// Run
renderFrameworkIntro();
