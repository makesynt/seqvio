import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
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

function publicWorkspacePackages(root) {
  return fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, 'packages', entry.name, 'package.json'))
    .filter((file) => fs.existsSync(file))
    .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
    .filter((manifest) => !manifest.private);
}

function npmVersionExists(npmCli, manifest, cwd, environment) {
  const result = spawnSync(process.execPath, [npmCli, 'view',
    `${manifest.name}@${manifest.version}`, 'version', '--json', '--prefer-online'], {
    cwd,
    env: environment,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.status !== 0) return false;
  try {
    const version = JSON.parse(result.stdout);
    return version === manifest.version
      || (Array.isArray(version) && version.includes(manifest.version));
  } catch {
    return false;
  }
}

function remoteGitTags(cwd, environment) {
  const result = spawnSync('git', ['ls-remote', '--tags', 'origin'], {
    cwd,
    env: environment,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.status !== 0) return new Set();
  return new Set(result.stdout.split(/\r?\n/)
    .map((line) => line.split(/\s+/)[1])
    .filter((ref) => ref?.startsWith('refs/tags/') && !ref.endsWith('^{}'))
    .map((ref) => ref.slice('refs/tags/'.length)));
}

export function inspectPublishedState(packages, options) {
  const missingVersions = [];
  const missingTags = [];
  const tags = remoteGitTags(options.cwd, options.environment);
  for (const manifest of packages) {
    if (!npmVersionExists(options.npmCli, manifest, options.cwd, options.environment)) {
      missingVersions.push(`${manifest.name}@${manifest.version}`);
    }
    const tag = `${manifest.name}@${manifest.version}`;
    if (!tags.has(tag)) missingTags.push(tag);
  }
  return {
    complete: packages.length > 0 && missingVersions.length === 0 && missingTags.length === 0,
    missingVersions,
    missingTags,
  };
}

function incompleteStateMessage(state) {
  const details = [];
  if (state.missingVersions.length > 0) {
    details.push(`missing npm versions: ${state.missingVersions.join(', ')}`);
  }
  if (state.missingTags.length > 0) details.push(`missing git tags: ${state.missingTags.join(', ')}`);
  return details.join('; ');
}

function repairMissingTags(state, cwd, environment) {
  if (state.missingVersions.length > 0 || state.missingTags.length === 0) return;
  for (const tag of state.missingTags) {
    const create = spawnSync('git', ['tag', tag], {
      cwd,
      env: environment,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    if (create.status !== 0) {
      throw new Error(`Unable to create missing release tag ${tag}: ${create.stderr || create.error || 'git tag failed'}`);
    }
    const push = spawnSync('git', ['push', 'origin', `refs/tags/${tag}`], {
      cwd,
      env: environment,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    if (push.status !== 0) {
      throw new Error(`Unable to push missing release tag ${tag}: ${push.stderr || push.error || 'git push failed'}`);
    }
    process.stdout.write(`Repaired missing release tag ${tag}; npm version already exists.\n`);
  }
}

async function waitForCompleteState(inspect, attempts, delayMs) {
  let state;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    state = inspect();
    if (state.complete) return state;
    if (attempt + 1 < attempts && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return state;
}

export async function publishPackages(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const environment = createPublishEnvironment(options.environment);
  const npmCli = options.npmCli ?? process.env.npm_execpath;
  if (!npmCli) throw new Error('npm_execpath is required; run publishing through npm run release');
  const packages = options.packages ?? publicWorkspacePackages(cwd);
  const inspect = options.inspectState ?? (() => inspectPublishedState(packages, {
    npmCli, cwd, environment,
  }));
  const initialState = inspect();
  if (initialState.complete) {
    process.stdout.write(`All ${packages.length} package versions and git tags already exist; skipping publish.\n`);
    return;
  }
  if (initialState.missingVersions.length === 0 && initialState.missingTags.length > 0) {
    repairMissingTags(initialState, cwd, environment);
    const repairedState = await waitForCompleteState(
      inspect,
      options.postconditionAttempts ?? 5,
      options.postconditionDelayMs ?? 2000,
    );
    if (!repairedState.complete) {
      throw new Error(`Release tags were repaired but release is still incomplete: ${incompleteStateMessage(repairedState)}`);
    }
    return;
  }

  const cliPath = options.cliPath ?? require.resolve('@changesets/cli/bin.js');
  const result = spawnSync(process.execPath, [cliPath, 'publish'], {
    cwd,
    env: environment,
    encoding: 'utf8',
    stdio: options.stdio ?? 'inherit',
  });
  if (result.error) throw result.error;
  const finalState = await waitForCompleteState(
    inspect,
    options.postconditionAttempts ?? 5,
    options.postconditionDelayMs ?? 2000,
  );
  if (!finalState.complete) {
    throw new Error(
      `changeset publish exited with code ${result.status ?? 'unknown'} and release is incomplete: `
      + incompleteStateMessage(finalState),
    );
  }
  if (result.status !== 0) {
    process.stderr.write(
      `changeset publish exited with code ${result.status}, but all exact npm versions and git tags exist; treating release as complete.\n`,
    );
  }
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await publishPackages();
