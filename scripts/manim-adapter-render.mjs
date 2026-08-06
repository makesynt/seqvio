import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { executeManimScene, preflightManim } from '../packages/manim-adapter/dist/index.js';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
const scenePath = args.get('--scene');
const expectedOutputPath = args.get('--expectedOutput');
const manifestPath = args.get('--manifest');
const pythonCommand = args.get('--python') ?? 'python';
const cacheDir = args.get('--cacheDir') ?? 'output/manim-adapter-cache';
if (!scenePath || !expectedOutputPath || !manifestPath) {
  console.error('Usage: node scripts/manim-adapter-render.mjs --scene <scene.json> --expectedOutput <video.mp4> --manifest <manifest.json> [--python <python>] [--cacheDir <dir>]');
  process.exit(2);
}

const scene = JSON.parse(await readFile(path.resolve(scenePath), 'utf8'));
const resolvedPythonCommand = /[\\/]/.test(pythonCommand) ? path.resolve(pythonCommand) : pythonCommand;
const manifest = await executeManimScene(scene, {
  cwd: process.cwd(), cacheDir: path.resolve(cacheDir), expectedOutputPath: path.resolve(expectedOutputPath),
  pythonCommand: resolvedPythonCommand, preflight: preflightManim(resolvedPythonCommand),
  onProgress: (event) => console.log(JSON.stringify(event)),
});
await writeFile(path.resolve(manifestPath), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(manifest, null, 2));
if (manifest.status !== 'rendered') process.exit(1);
