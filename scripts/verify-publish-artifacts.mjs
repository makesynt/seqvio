import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

function collectExportTargets(value, targets = []) {
  if (typeof value === 'string') targets.push(value);
  else if (value && typeof value === 'object') {
    for (const child of Object.values(value)) collectExportTargets(child, targets);
  }
  return targets;
}

export function requiredPublishFiles(manifest) {
  const targets = [manifest.main, manifest.types, ...Object.values(manifest.bin ?? {}),
    ...collectExportTargets(manifest.exports)];
  return [...new Set(targets
    .filter((target) => typeof target === 'string' && !target.includes('*'))
    .map((target) => target.replace(/^\.\//, '').replace(/\\/g, '/')))];
}

function runPackDryRun(npmCli, packageName, cwd) {
  const result = spawnSync(process.execPath, [npmCli,
    'pack', '--dry-run', '--json', '--ignore-scripts', '--workspace', packageName], {
    cwd,
    encoding: 'utf8',
    shell: false,
    stdio: 'pipe',
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(`npm pack --dry-run failed for ${packageName}`);
  }
  return JSON.parse(result.stdout)[0];
}

export function verifyPublishArtifacts(options = {}) {
  const root = options.root ?? process.cwd();
  const npmCli = options.npmCli ?? process.env.npm_execpath;
  if (!npmCli) {
    throw new Error('npm_execpath is required; run this check through npm run verify:publish-artifacts');
  }
  const packageDirectories = fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
  const verified = [];

  for (const directory of packageDirectories) {
    const manifestPath = path.join(root, 'packages', directory.name, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.private) continue;

    const report = runPackDryRun(npmCli, manifest.name, root);
    const packedFiles = new Set(report.files.map((file) => file.path.replace(/\\/g, '/')));
    const missing = requiredPublishFiles(manifest).filter((file) => !packedFiles.has(file));
    if (missing.length > 0) {
      throw new Error(`${manifest.name} is missing required packed files: ${missing.join(', ')}`);
    }
    verified.push(manifest.name);
  }

  return verified;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const packages = verifyPublishArtifacts();
  process.stdout.write(`Publish artifacts verified for ${packages.length} packages.\n`);
}
