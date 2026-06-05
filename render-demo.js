/**
 * Demo Video Renderer
 * Direct rendering without React - just HTML/Canvas/SVG
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, 'output');
const TEMP_DIR = path.join(__dirname, 'temp');
const FPS = 30;
const TOTAL_FRAMES = 2700; // 90 seconds

// Create directories
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// HTML template with inline rendering
const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; }
    body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      font-family: Arial, sans-serif;
    }
    #scene {
      width: 100%;
      height: 100%;
      position: relative;
      background: white;
    }
  </style>
</head>
<body>
  <svg id="scene" width="1920" height="1080">
    <!-- Content will be rendered here -->
  </svg>

  <script>
    const scene = document.getElementById('scene');
    let currentFrame = 0;

    // Helper: calculate progress
    function progress(frame, start, duration) {
      if (frame < start) return 0;
      if (frame >= start + duration) return 1;
      return (frame - start) / duration;
    }

    // Helper: easeOut
    function easeOut(t) {
      return t * (2 - t);
    }

    // Draw text
    function drawText(text, x, y, props, frame) {
      const p = progress(frame, props.start, props.duration);
      if (p === 0) return;

      const visibleLength = Math.floor(text.length * easeOut(p));
      const visibleText = text.substring(0, visibleLength);

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', x);
      textEl.setAttribute('y', y);
      textEl.setAttribute('font-size', props.fontSize || 48);
      textEl.setAttribute('font-weight', props.fontWeight || 'normal');
      textEl.setAttribute('fill', props.fillColor || 'none');
      textEl.setAttribute('stroke', props.strokeColor || '#2c3e50');
      textEl.setAttribute('stroke-width', props.strokeWidth || 2);
      textEl.setAttribute('text-anchor', props.align || 'start');
      textEl.textContent = visibleText;

      scene.appendChild(textEl);
    }

    // Draw circle
    function drawCircle(cx, cy, r, props, frame) {
      const p = progress(frame, props.start, props.duration);
      if (p === 0) return;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', props.fillColor || 'none');
      circle.setAttribute('stroke', props.strokeColor || '#2c3e50');
      circle.setAttribute('stroke-width', props.strokeWidth || 3);

      const circumference = 2 * Math.PI * r;
      circle.setAttribute('stroke-dasharray', circumference);
      circle.setAttribute('stroke-dashoffset', circumference * (1 - easeOut(p)));

      scene.appendChild(circle);
    }

    // Draw rectangle
    function drawRect(x, y, w, h, props, frame) {
      const p = progress(frame, props.start, props.duration);
      if (p === 0) return;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', w);
      rect.setAttribute('height', h);
      rect.setAttribute('fill', props.fillColor || 'none');
      rect.setAttribute('stroke', props.strokeColor || '#2c3e50');
      rect.setAttribute('stroke-width', props.strokeWidth || 3);

      const perimeter = 2 * (w + h);
      rect.setAttribute('stroke-dasharray', perimeter);
      rect.setAttribute('stroke-dashoffset', perimeter * (1 - easeOut(p)));

      scene.appendChild(rect);
    }

    // Render frame
    window.renderFrame = function(frame) {
      currentFrame = frame;
      scene.innerHTML = '';

      // Title
      drawText('Seqvio Whiteboard', 960, 300, {
        start: 0, duration: 120, fontSize: 72, fontWeight: 'bold',
        strokeColor: '#2c3e50', fillColor: '#3498db', align: 'middle'
      }, frame);

      drawText("The World's First Open-Source AI Whiteboard Framework", 960, 400, {
        start: 120, duration: 90, fontSize: 36, strokeColor: '#7f8c8d', align: 'middle'
      }, frame);

      // Feature 1
      drawCircle(300, 300, 45, {
        start: 360, duration: 60, strokeColor: '#27ae60', fillColor: '#d5f4e6'
      }, frame);

      drawText('1', 300, 320, {
        start: 420, duration: 25, fontSize: 52, fontWeight: 'bold',
        strokeColor: '#27ae60', align: 'middle'
      }, frame);

      drawRect(400, 250, 450, 120, {
        start: 445, duration: 75, strokeColor: '#27ae60', strokeWidth: 3
      }, frame);

      drawText('100% Open Source', 625, 290, {
        start: 520, duration: 60, fontSize: 42, fontWeight: 'bold',
        strokeColor: '#27ae60', align: 'middle'
      }, frame);

      drawText('MIT License - Free Forever', 625, 335, {
        start: 580, duration: 50, fontSize: 28, strokeColor: '#7f8c8d', align: 'middle'
      }, frame);

      // Feature 2
      drawCircle(300, 480, 45, {
        start: 630, duration: 60, strokeColor: '#3498db', fillColor: '#ebf5fb'
      }, frame);

      drawText('2', 300, 500, {
        start: 690, duration: 25, fontSize: 52, fontWeight: 'bold',
        strokeColor: '#3498db', align: 'middle'
      }, frame);

      drawRect(400, 430, 450, 120, {
        start: 715, duration: 75, strokeColor: '#3498db', strokeWidth: 3
      }, frame);

      drawText('React + TypeScript', 625, 470, {
        start: 790, duration: 60, fontSize: 42, fontWeight: 'bold',
        strokeColor: '#3498db', align: 'middle'
      }, frame);

      drawText('Modern & Type-Safe', 625, 515, {
        start: 850, duration: 50, fontSize: 28, strokeColor: '#7f8c8d', align: 'middle'
      }, frame);

      // CTA (simplified - just showing concept)
      if (frame >= 2250) {
        drawRect(510, 450, 900, 180, {
          start: 2250, duration: 90, strokeColor: '#e74c3c', strokeWidth: 5
        }, frame);

        drawText('Start Creating Today!', 960, 540, {
          start: 2340, duration: 90, fontSize: 68, fontWeight: 'bold',
          strokeColor: '#e74c3c', align: 'middle'
        }, frame);
      }
    };
  </script>
</body>
</html>
`;

async function render() {
  console.log('🎬 Starting render...\n');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setContent(html);

  console.log(`🎞️  Rendering ${TOTAL_FRAMES} frames (${TOTAL_FRAMES / FPS} seconds)...\n`);

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    await page.evaluate((f) => {
      window.renderFrame(f);
    }, frame);

    const framePath = path.join(TEMP_DIR, `frame-${String(frame).padStart(6, '0')}.png`);
    await page.screenshot({ path: framePath });

    if (frame % 90 === 0 || frame === TOTAL_FRAMES - 1) {
      const percent = Math.round(((frame + 1) / TOTAL_FRAMES) * 100);
      const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
      process.stdout.write(`\r[${bar}] ${percent}% - Frame ${frame + 1}/${TOTAL_FRAMES}`);
    }
  }

  await browser.close();

  console.log('\n\n🎞️  Encoding video with FFmpeg...\n');

  const outputPath = path.join(OUTPUT_DIR, 'framework-intro.mp4');
  const framePattern = path.join(TEMP_DIR, 'frame-%06d.png');

  execSync(`ffmpeg -y -framerate ${FPS} -i "${framePattern}" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium "${outputPath}"`, {
    stdio: 'inherit'
  });

  console.log('\n✅ Render complete!');
  console.log(`📹 Video saved to: ${outputPath}`);
  console.log(`📊 Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

  // Cleanup
  console.log('\n🧹 Cleaning up temp files...');
  const files = fs.readdirSync(TEMP_DIR);
  for (const file of files) {
    if (file.endsWith('.png')) {
      fs.unlinkSync(path.join(TEMP_DIR, file));
    }
  }

  console.log('\n🎉 Done!');
}

render().catch(console.error);
