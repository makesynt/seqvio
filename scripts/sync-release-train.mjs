import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

function readJson(root, file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function writeJson(root, file, value) {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function releaseLine(version, packageName) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(version);
  if (!match) throw new Error(`${packageName} has an invalid SemVer version: ${version}`);
  return `${match[1]}.${match[2]}`;
}

function compareReleaseLines(left, right) {
  const [leftMajor, leftMinor] = left.split('.').map(Number);
  const [rightMajor, rightMinor] = right.split('.').map(Number);
  return leftMajor - rightMajor || leftMinor - rightMinor;
}

export function syncReleaseTrain(root = process.cwd()) {
  const policy = readJson(root, 'seqvio.release-policy.json');
  const rootPackage = readJson(root, 'package.json');
  const packageLock = readJson(root, 'package-lock.json');
  const packageFiles = fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `packages/${entry.name}/package.json`)
    .filter((file) => fs.existsSync(path.join(root, file)));
  const packages = new Map(packageFiles.map((file) => {
    const manifest = readJson(root, file);
    return [manifest.name, { file, manifest }];
  }));

  if (!Array.isArray(policy.releaseTrain?.packages) || policy.releaseTrain.packages.length === 0) {
    throw new Error('seqvio.release-policy.json must declare at least one release-train package');
  }

  const releasePackages = policy.releaseTrain.packages.map((name) => {
    const entry = packages.get(name);
    if (!entry) throw new Error(`Release-train package is missing: ${name}`);
    return { name, ...entry };
  });
  const lines = new Set(releasePackages.map(({ name, manifest }) =>
    releaseLine(manifest.version, name)));
  if (lines.size !== 1) {
    const versions = releasePackages.map(({ name, manifest }) => `${name}@${manifest.version}`).join(', ');
    throw new Error(`Release-train packages must share one major/minor line: ${versions}`);
  }

  const nextLine = [...lines][0];
  const currentLine = policy.releaseTrain.line;
  if (!/^\d+\.\d+$/.test(currentLine)) {
    throw new Error(`Invalid current release train: ${JSON.stringify(currentLine)}`);
  }
  if (compareReleaseLines(nextLine, currentLine) < 0) {
    throw new Error(`Release train cannot move backward from ${currentLine} to ${nextLine}`);
  }

  policy.releaseTrain.line = nextLine;
  rootPackage.version = `${nextLine}.0`;
  rootPackage.seqvio = { ...rootPackage.seqvio, releaseTrain: nextLine };
  for (const { manifest } of releasePackages) {
    manifest.seqvio = { ...manifest.seqvio, releaseTrain: nextLine };
  }

  if (packageLock.name !== rootPackage.name || !packageLock.packages?.['']) {
    throw new Error('package-lock.json is missing the root workspace package');
  }
  packageLock.version = rootPackage.version;
  packageLock.packages[''].version = rootPackage.version;
  for (const { file, manifest } of packages.values()) {
    const workspacePath = path.posix.dirname(file);
    const lockEntry = packageLock.packages[workspacePath];
    if (!lockEntry) throw new Error(`package-lock.json is missing workspace ${workspacePath}`);
    lockEntry.version = manifest.version;
    for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
      const manifestDependencies = manifest[section] ?? {};
      const lockDependencies = lockEntry[section] ?? {};
      for (const dependency of Object.keys(lockDependencies)) {
        if (packages.has(dependency) && !(dependency in manifestDependencies)) {
          delete lockDependencies[dependency];
        }
      }
      for (const [dependency, range] of Object.entries(manifestDependencies)) {
        if (packages.has(dependency)) lockDependencies[dependency] = range;
      }
      if (Object.keys(lockDependencies).length > 0) lockEntry[section] = lockDependencies;
      else delete lockEntry[section];
    }
  }

  writeJson(root, 'seqvio.release-policy.json', policy);
  writeJson(root, 'package.json', rootPackage);
  for (const { file, manifest } of releasePackages) writeJson(root, file, manifest);
  writeJson(root, 'package-lock.json', packageLock);

  return {
    previousLine: currentLine,
    releaseLine: nextLine,
    packages: releasePackages.map(({ name }) => name),
  };
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const result = syncReleaseTrain();
  process.stdout.write(
    `Seqvio release train synchronized: ${result.previousLine} -> ${result.releaseLine} (${result.packages.length} packages).\n`,
  );
}
