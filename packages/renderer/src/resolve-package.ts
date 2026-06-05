import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';

const moduleRequire = createRequire(__filename);

export function getRendererPackageRoot(): string {
  return path.resolve(__dirname, '..');
}

function collectSearchPaths(): string[] {
  const paths = new Set<string>([getRendererPackageRoot(), process.cwd()]);

  let dir = process.cwd();
  while (true) {
    paths.add(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return [...paths];
}

export function resolvePackageRoot(packageName: string): string {
  const entryPath = moduleRequire.resolve(packageName, {
    paths: collectSearchPaths(),
  });

  let dir = path.dirname(entryPath);
  while (true) {
    const pkgJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as { name?: string };
      if (pkg.name === packageName) {
        return dir;
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(`Could not resolve package root for ${packageName}`);
}

export function resolvePackageModuleEntry(packageName: string): string {
  const root = resolvePackageRoot(packageName);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
    main?: string;
  };
  const main = pkg.main ?? 'dist/index.js';
  return path.join(root, main);
}

export function resolvePackageFile(packageName: string, ...segments: string[]): string {
  return path.join(resolvePackageRoot(packageName), ...segments);
}

export function collectNodeModulesRoots(): string[] {
  const roots = new Set<string>();

  for (const searchRoot of collectSearchPaths()) {
    roots.add(path.join(searchRoot, 'node_modules'));
  }

  for (const packageName of ['@seqvio/renderer', '@seqvio/whiteboard', '@seqvio/core']) {
    try {
      const packageRoot = resolvePackageRoot(packageName);
      let dir = packageRoot;
      while (true) {
        roots.add(path.join(dir, 'node_modules'));
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
    } catch {
      // Package may not be installed yet during local development.
    }
  }

  return [...roots];
}
