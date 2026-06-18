#!/usr/bin/env node
/**
 * seqvio-add — copy a catalog block into the current project.
 *
 *   seqvio-add <block-name>            Copy block to examples/compositions/
 *   seqvio-add <block-name> --dest ./  Copy block to a custom destination
 *   seqvio-add --list                  List available blocks
 */

import * as fs from 'fs';
import * as path from 'path';

function catalogDir(): string {
  // When installed globally the catalog lives next to the package.
  // When running from the repo root it lives at <repoRoot>/catalog/.
  const candidates = [
    // Running from the repo root (development)
    path.resolve(__dirname, '..', '..', '..', 'catalog'),
    // Installed globally alongside the renderer package
    path.resolve(__dirname, '..', 'catalog'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    'catalog/ directory not found. Run from the seqvio repo root or reinstall @seqvio/renderer.'
  );
}

interface BlockMeta {
  name: string;
  description: string;
  style: string;
  packages: string[];
  file: string;
  destName: string;
}

function listBlocks(catDir: string): BlockMeta[] {
  return fs
    .readdirSync(catDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const metaPath = path.join(catDir, e.name, 'block.json');
      if (!fs.existsSync(metaPath)) return null;
      return JSON.parse(fs.readFileSync(metaPath, 'utf8')) as BlockMeta;
    })
    .filter(Boolean) as BlockMeta[];
}

function resolveBlock(catDir: string, name: string): { meta: BlockMeta; srcPath: string } {
  const blockDir = path.join(catDir, name);
  const metaPath = path.join(blockDir, 'block.json');
  if (!fs.existsSync(metaPath)) {
    throw new Error(`Block "${name}" not found in catalog. Run seqvio-add --list to see available blocks.`);
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as BlockMeta;
  const srcPath = path.join(blockDir, meta.file);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Block source file missing: ${srcPath}`);
  }
  return { meta, srcPath };
}

function defaultDest(): string {
  const examples = path.join(process.cwd(), 'examples', 'compositions');
  return fs.existsSync(examples) ? examples : process.cwd();
}

function checkPackages(meta: BlockMeta): void {
  const pkgJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const installed = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
  const missing = meta.packages.filter((p) => !installed.has(p));
  if (missing.length > 0) {
    console.warn(
      `\nWarning: block "${meta.name}" requires packages not in your package.json:\n` +
        missing.map((p) => `  ${p}`).join('\n') +
        '\nRun: npm install ' + missing.join(' ')
    );
  }
}

function printUsage(): void {
  console.log(`Usage:
  seqvio-add <block-name>               Copy block to examples/compositions/ (or cwd)
  seqvio-add <block-name> --dest <dir>  Copy block to a custom directory
  seqvio-add --list                     List available blocks
  seqvio-add --help                     Show this help
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const showHelp = argv.includes('--help');
  const showList = argv.includes('--list');

  if (showHelp || argv.length === 0) {
    printUsage();
    return;
  }

  const catDir = catalogDir();

  if (showList) {
    const blocks = listBlocks(catDir);
    if (blocks.length === 0) {
      console.log('No blocks found in catalog.');
      return;
    }
    console.log('Available blocks:\n');
    for (const b of blocks) {
      console.log(`  ${b.name.padEnd(20)} ${b.description}`);
      console.log(`  ${''.padEnd(20)} Style: ${b.style}  Requires: ${b.packages.join(', ')}\n`);
    }
    return;
  }

  // Find first non-flag argument as block name.
  const blockName = argv.find((a) => !a.startsWith('--'));
  if (!blockName) {
    printUsage();
    throw new Error('Block name is required.');
  }

  const destIdx = argv.indexOf('--dest');
  const destDir = destIdx >= 0 && argv[destIdx + 1]
    ? path.resolve(argv[destIdx + 1])
    : defaultDest();

  const { meta, srcPath } = resolveBlock(catDir, blockName);
  checkPackages(meta);

  const destPath = path.join(destDir, meta.destName);
  if (fs.existsSync(destPath) && !argv.includes('--force')) {
    throw new Error(`Destination already exists (use --force to overwrite): ${destPath}`);
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(`Added "${meta.name}" → ${destPath}`);
  console.log(`Style: ${meta.style}`);
  if (meta.packages.length > 0) {
    console.log(`Requires: ${meta.packages.join(', ')}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`seqvio-add failed: ${message}`);
  process.exit(1);
});
