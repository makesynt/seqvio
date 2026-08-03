import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

export function createPublishEnvironment(environment = process.env) {
  return {
    ...environment,
    // Changesets publishes packages concurrently. Building in npm lifecycle
    // hooks would race with packages that consume another workspace's dist.
    npm_config_ignore_scripts: 'true',
  };
}

export function publishPackages(options = {}) {
  const cliPath = options.cliPath ?? require.resolve('@changesets/cli/bin.js');
  const result = spawnSync(process.execPath, [cliPath, 'publish'], {
    cwd: options.cwd ?? process.cwd(),
    env: createPublishEnvironment(options.environment),
    encoding: 'utf8',
    stdio: options.stdio ?? 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`changeset publish failed with exit code ${result.status ?? 'unknown'}`);
  }
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) publishPackages();
