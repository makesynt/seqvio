#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const probe = "const pty = require('node-pty'); if (typeof pty.spawn !== 'function') process.exit(1);";

function canLoadNodePty() {
  return spawnSync(process.execPath, ['-e', probe], {
    cwd: root,
    stdio: 'ignore',
  }).status === 0;
}

if (canLoadNodePty()) {
  console.log(`node-pty native module is ready on ${process.platform}/${process.arch}.`);
  process.exit(0);
}

console.warn(
  `node-pty is installed without a loadable native module on ${process.platform}/${process.arch}; rebuilding from source.`,
);
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rebuild = spawnSync(npmCommand, ['rebuild', 'node-pty', '--build-from-source'], {
  cwd: root,
  env: { ...process.env, npm_config_build_from_source: 'true' },
  stdio: 'inherit',
});

if (rebuild.error) throw rebuild.error;
if (rebuild.status !== 0) {
  throw new Error(`npm rebuild node-pty failed with exit code ${rebuild.status ?? 'unknown'}.`);
}
if (!canLoadNodePty()) {
  throw new Error('node-pty still cannot be loaded after rebuilding from source.');
}

console.log(`node-pty native module rebuilt successfully on ${process.platform}/${process.arch}.`);
