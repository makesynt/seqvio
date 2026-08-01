import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: process.cwd(), stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0
      ? resolve()
      : reject(new Error(`node ${args.join(' ')} failed with exit code ${code}`)));
  });
}

function assertComplete(jobDir) {
  const artifactsPath = path.join(jobDir, 'artifacts.json');
  const artifacts = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
  if (artifacts.status !== 'complete' || !artifacts.artifacts?.qaReport) {
    throw new Error(`Capture job did not complete with QA: ${artifactsPath}`);
  }
  for (const name of ['final.mp4', 'qa-report.json']) {
    const filePath = path.join(jobDir, name);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      throw new Error(`Expected non-empty runtime artifact: ${filePath}`);
    }
  }
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-host-runtime-'));
const requestedKind = process.argv.includes('--kind')
  ? process.argv[process.argv.indexOf('--kind') + 1]
  : 'all';
if (!['all', 'terminal', 'browser'].includes(requestedKind)) {
  throw new Error('--kind must be all, terminal, or browser');
}
let succeeded = false;
const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end('<!doctype html><title>Seqvio host smoke</title><style>html,body{margin:0;min-height:100%;background:#111827;color:#fff;font:32px system-ui}main{padding:96px}button{padding:20px 36px;font:inherit;background:#22c55e;color:#07140b;border:0}</style><main><h1>Capture ready</h1><button id="run">Run</button></main>');
});

try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Unable to resolve smoke server port');

  const planPath = path.join(tempRoot, 'browser-plan.json');
  fs.writeFileSync(planPath, `${JSON.stringify({
    version: '1.0',
    name: 'Host runtime smoke',
    startUrl: `http://127.0.0.1:${address.port}`,
    viewport: { width: 1280, height: 720 },
    captureFps: 10,
    renderFps: 30,
    actions: [
      { id: 'run', type: 'click', label: 'Run', selector: '#run', afterMs: 250 },
    ],
  }, null, 2)}\n`, 'utf8');

  if (requestedKind === 'all' || requestedKind === 'terminal') {
    await runNode([
      'packages/terminal-narrator/dist/cli.js', 'record', '--sample',
      '--outputDir', tempRoot, '--jobId', 'terminal', '--json',
    ]);
    assertComplete(path.join(tempRoot, 'terminal'));
  }
  if (requestedKind === 'all' || requestedKind === 'browser') {
    await runNode([
      'packages/browser-recorder/dist/cli.js', 'record', '--plan', planPath,
      '--outputDir', tempRoot, '--jobId', 'browser', '--json',
    ]);
    assertComplete(path.join(tempRoot, 'browser'));
  }
  succeeded = true;
  process.stdout.write(`Capture runtime smoke passed on ${process.platform}/${process.arch}.\n`);
} finally {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(() => resolve()));
  if (!succeeded) {
    for (const kind of ['terminal', 'browser']) {
      const reportPath = path.join(tempRoot, kind, 'qa-report.json');
      if (fs.existsSync(reportPath)) process.stderr.write(fs.readFileSync(reportPath, 'utf8'));
    }
  }
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
