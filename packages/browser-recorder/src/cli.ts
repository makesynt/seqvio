#!/usr/bin/env node
import * as path from 'node:path';
import { createRecorderServer } from './server';

function readFlag(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const command = process.argv[2] ?? 'serve';
if (command !== 'serve') {
  console.error('Usage: seqvio-recorder serve [--port 4175] [--host 127.0.0.1] [--output output/browser-recorder]');
  process.exit(1);
}

const port = Number(readFlag('--port', '4175'));
const host = readFlag('--host', '127.0.0.1');
const outputDir = path.resolve(readFlag('--output', 'output/browser-recorder'));
const server = createRecorderServer({ port, host, outputDir });
server.listen(port, host, () => {
  console.log(`Seqvio Browser Recorder: http://${host}:${port}`);
  console.log(`Jobs: ${outputDir}`);
});
