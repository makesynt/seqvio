#!/usr/bin/env node
/**
 * Extract + synthesize narration for technical-explainer-v2, then render with
 * the resolved audio manifest (lockToAudio).
 *
 * Usage:
 *   node scripts/technical-explainer-audio-loop.mjs
 *   node scripts/technical-explainer-audio-loop.mjs --synthesize-only
 *   node scripts/technical-explainer-audio-loop.mjs --render-only
 *   node scripts/technical-explainer-audio-loop.mjs --smoke   # short frame window
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const component = 'examples/compositions/technical-explainer-v2.tsx';
const outDir = path.join(root, 'output', 'technical-explainer-v2-audio');
const manifest = path.join(outDir, 'audio-manifest.json');
const resolved = path.join(outDir, 'audio-manifest.resolved.json');
const mp4 = path.join(root, 'output', 'technical-explainer-v2.mp4');

const args = new Set(process.argv.slice(2));
const synthesizeOnly = args.has('--synthesize-only');
const renderOnly = args.has('--render-only');
const smoke = args.has('--smoke');

function run(command, commandArgs, env = {}) {
  console.log(`\n> ${command} ${commandArgs.join(' ')}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

fs.mkdirSync(outDir, { recursive: true });

const generateCli = path.join(root, 'packages', 'renderer', 'dist', 'audio-cli.js');
const renderCli = path.join(root, 'packages', 'renderer', 'dist', 'cli.js');

if (!renderOnly) {
  run('node', [generateCli, 'extract', '--component', component, '--out', manifest]);
  run(
    'node',
    [
      generateCli,
      'synthesize',
      '--provider',
      'edge-tts',
      '--manifest',
      manifest,
      '--outDir',
      outDir,
    ],
    {
      EDGE_TTS_VOICE: process.env.EDGE_TTS_VOICE ?? 'en-US-JennyNeural',
    }
  );
}

if (synthesizeOnly) {
  console.log(`\nResolved manifest: ${resolved}`);
  process.exit(0);
}

if (!fs.existsSync(resolved)) {
  console.error(`Missing resolved manifest: ${resolved}`);
  process.exit(1);
}

const renderArgs = [
  renderCli,
  '--component',
  component,
  '--output',
  smoke ? path.join(root, 'output', 'technical-explainer-v2-smoke.mp4') : mp4,
  '--audioManifest',
  resolved,
  '--preset',
  'preview',
];

if (smoke) {
  renderArgs.push('--startFrame', '0', '--endFrame', '89');
}

run('node', renderArgs);
console.log(`\nDone. Output: ${smoke ? 'output/technical-explainer-v2-smoke.mp4' : 'output/technical-explainer-v2.mp4'}`);
