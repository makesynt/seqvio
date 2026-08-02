#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const probe = "const pty = require('node-pty'); if (typeof pty.spawn !== 'function') process.exit(1);";

function ensureSpawnHelperExecutable() {
  if (process.platform === 'win32') return;
  const packageDir = path.dirname(require.resolve('node-pty/package.json'));
  for (const helperPath of [
    path.join(packageDir, 'prebuilds', `${process.platform}-${process.arch}`, 'spawn-helper'),
    path.join(packageDir, 'build', 'Release', 'spawn-helper'),
  ]) {
    if (existsSync(helperPath)) chmodSync(helperPath, 0o755);
  }
}

ensureSpawnHelperExecutable();

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
const rebuild = spawnSync(npmCommand, ['rebuild', 'node-pty'], {
  cwd: root,
  stdio: 'inherit',
});

if (rebuild.error) throw rebuild.error;
if (rebuild.status !== 0) {
  throw new Error(`npm rebuild node-pty failed with exit code ${rebuild.status ?? 'unknown'}.`);
}
if (!canLoadNodePty()) {
  throw new Error('node-pty still cannot be loaded after rebuilding from source.');
}
ensureSpawnHelperExecutable();

console.log(`node-pty native module rebuilt successfully on ${process.platform}/${process.arch}.`);
