import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import {
  CAPTURE_ADAPTER_LIFECYCLE,
  CAPTURE_ARTIFACT_MANIFEST_VERSION,
  CAPTURE_CLI_CONTRACT_VERSION,
} from '../packages/capture/dist/cli-contract.js';

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
const adapters = [
  {
    packageName: '@seqvio/terminal-narrator',
    packagePath: 'packages/terminal-narrator/package.json',
    cliPath: 'packages/terminal-narrator/dist/cli.js',
  },
  {
    packageName: '@seqvio/browser-recorder',
    packagePath: 'packages/browser-recorder/package.json',
    cliPath: 'packages/browser-recorder/dist/cli.js',
  },
];

for (const adapter of adapters) {
  run(process.execPath, [npmCli, 'pack', '--dry-run', '--workspace', adapter.packageName]);

  const manifest = JSON.parse(readFileSync(adapter.packagePath, 'utf8'));
  const metadata = manifest.seqvio ?? {};
  const expectedMetadata = {
    cliContractVersion: CAPTURE_CLI_CONTRACT_VERSION,
    adapterLifecycle: CAPTURE_ADAPTER_LIFECYCLE,
    artifactManifestVersion: CAPTURE_ARTIFACT_MANIFEST_VERSION,
  };
  for (const [field, expected] of Object.entries(expectedMetadata)) {
    if (metadata[field] !== expected) {
      throw new Error(
        `${adapter.packageName} seqvio.${field} must be ${expected}; received ${JSON.stringify(metadata[field])}`,
      );
    }
  }

  const result = JSON.parse(run(process.execPath, [adapter.cliPath, '--help', '--json']));
  if (
    result.ok !== true
    || result.command !== 'help'
    || result.cliContractVersion !== CAPTURE_CLI_CONTRACT_VERSION
    || result.lifecycle !== CAPTURE_ADAPTER_LIFECYCLE
  ) {
    throw new Error(
      `Unexpected ${adapter.packageName} CLI contract: ${JSON.stringify(result)}`,
    );
  }
}

process.stdout.write(`Capture host contract passed on ${process.platform}/${process.arch}.\n`);
