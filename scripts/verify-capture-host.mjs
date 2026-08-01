import { spawnSync } from 'node:child_process';
import process from 'node:process';

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
    stdio: 'pipe',
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}: ${result.error?.message ?? 'unknown error'}`,
    );
  }
  return result.stdout.trim();
}

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required; run this check through npm run verify:capture-host');
for (const packageName of ['@seqvio/terminal-narrator', '@seqvio/browser-recorder']) {
  run(process.execPath, [npmCli, 'pack', '--dry-run', '--workspace', packageName]);
}

const terminal = JSON.parse(run(process.execPath, [
  'packages/terminal-narrator/dist/cli.js', '--help', '--json',
]));
const browser = JSON.parse(run(process.execPath, [
  'packages/browser-recorder/dist/cli.js', '--help', '--json',
]));

for (const result of [terminal, browser]) {
  if (result.ok !== true || result.cliContractVersion !== '1.0') {
    throw new Error(`Unexpected capture CLI contract: ${JSON.stringify(result)}`);
  }
}

process.stdout.write(`Capture host contract passed on ${process.platform}/${process.arch}.\n`);
