import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';

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

function readTarString(buffer, offset, length) {
  const field = buffer.subarray(offset, offset + length);
  const end = field.indexOf(0);
  return field.subarray(0, end === -1 ? field.length : end).toString('utf8');
}

export function readTarEntries(tarballPath) {
  const archive = gunzipSync(fs.readFileSync(tarballPath));
  const entries = [];
  let offset = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = readTarString(header, 0, 100);
    const prefix = readTarString(header, 345, 155);
    const sizeText = readTarString(header, 124, 12).trim();
    const size = sizeText === '' ? 0 : Number.parseInt(sizeText, 8);
    if (!Number.isFinite(size)) throw new Error(`Invalid tar entry size for ${name}`);
    entries.push(prefix ? `${prefix}/${name}` : name);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return entries;
}

function packPackage(npmCli, packageName, cwd) {
  const packDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-pack-'));
  try {
    const result = spawnSync(process.execPath, [npmCli,
      'pack', '--ignore-scripts', '--workspace', packageName,
      '--pack-destination', packDirectory], {
      cwd,
      encoding: 'utf8',
      shell: false,
      stdio: 'pipe',
    });
    if (result.status !== 0) {
      process.stderr.write(result.stdout ?? '');
      process.stderr.write(result.stderr ?? '');
      throw new Error(`npm pack failed for ${packageName}`);
    }
    const archives = fs.readdirSync(packDirectory)
      .filter((file) => file.endsWith('.tgz'));
    if (archives.length !== 1) {
      throw new Error(
        `npm pack for ${packageName} produced ${archives.length} archives; expected exactly one`,
      );
    }
    return readTarEntries(path.join(packDirectory, archives[0]));
  } finally {
    fs.rmSync(packDirectory, { recursive: true, force: true });
  }
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

    const packedFiles = new Set(packPackage(npmCli, manifest.name, root)
      .map((file) => file.replace(/^package\//, '').replace(/\\/g, '/')));
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
