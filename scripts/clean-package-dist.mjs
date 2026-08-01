import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, '..');
const packageDir = path.resolve(process.cwd());
const packagesRoot = path.join(workspaceRoot, 'packages');
const relativePackageDir = path.relative(packagesRoot, packageDir);
const packageJsonPath = path.join(packageDir, 'package.json');

if (
  relativePackageDir === '' ||
  relativePackageDir.startsWith('..') ||
  path.isAbsolute(relativePackageDir) ||
  !fs.existsSync(packageJsonPath)
) {
  throw new Error(`Refusing to clean dist outside a workspace package: ${packageDir}`);
}

const distDir = path.join(packageDir, 'dist');
if (path.basename(distDir) !== 'dist' || path.dirname(distDir) !== packageDir) {
  throw new Error(`Invalid package dist target: ${distDir}`);
}

fs.rmSync(distDir, { recursive: true, force: true });
