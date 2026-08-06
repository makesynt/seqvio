import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForDemo(port, child) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`serve process exited early with ${child.exitCode}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/demo`);
      if (response.ok) return response.text();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('serve process did not become ready');
}

test('CLI serve entrypoint remains alive and responds until terminated', async (t) => {
  const port = await reservePort();
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-browser-serve-'));
  const cli = path.resolve('dist/cli.js');
  const child = spawn(process.execPath, [cli, 'serve', '--port', String(port), '--outputDir', outputDir], {
    stdio: 'ignore',
    windowsHide: true,
  });
  t.after(() => {
    if (child.exitCode === null) child.kill();
  });
  const html = await waitForDemo(port, child);
  assert.match(html, /Seqvio Recorder/);
  assert.equal(child.exitCode, null);
  child.kill();
});
