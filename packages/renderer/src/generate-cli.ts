#!/usr/bin/env node
/**
 * seqvio-generate — compile a Storyboard IR (JSON) into a TSX composition.
 *
 *   seqvio-generate --ir story.json --out scene.tsx
 *   seqvio-generate validate --ir story.json
 *
 * This is the deterministic half of the AI input pipeline:
 *   prompt/document -> [LLM] -> Storyboard IR -> (this) -> TSX -> MP4
 * The LLM step is intentionally not wired here yet; once it produces IR JSON,
 * it flows straight into `validate` + compile with no other change.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  compileStoryboardToTsx,
  validateStoryboard,
  type Storyboard,
} from '@seqvio/core';

type CommandName = 'compile' | 'validate';

function printUsage(): void {
  console.log(`Usage:
  seqvio-generate --ir <path> --out <path>     Compile storyboard JSON to TSX
  seqvio-generate validate --ir <path>          Validate storyboard JSON

Options:
  --ir <path>     Path to storyboard IR JSON (required)
  --out <path>    Output TSX path (required for compile)
  --style <name>  Override style: whiteboard | presentation
  --force         Overwrite an existing --out file
  --help
`);
}

function parseArgs(argv: string[]): {
  command: CommandName;
  args: Map<string, string | boolean>;
} {
  const [maybeCommand, ...rest] = argv;
  let command: CommandName = 'compile';
  let tokens = argv;
  if (maybeCommand === 'validate' || maybeCommand === 'compile') {
    command = maybeCommand;
    tokens = rest;
  }

  const args = new Map<string, string | boolean>();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'help' || key === 'force') {
      args.set(key, true);
      continue;
    }
    const value = tokens[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    args.set(key, value);
    i += 1;
  }
  return { command, args };
}

function requireString(args: Map<string, string | boolean>, key: string): string {
  const value = args.get(key);
  if (typeof value !== 'string') {
    throw new Error(`Missing required --${key}`);
  }
  return value;
}

function loadStoryboard(irPath: string): unknown {
  const resolvedPath = path.resolve(irPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Storyboard JSON not found: ${resolvedPath}`);
  }
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Storyboard JSON is not valid JSON: ${message}`);
  }
}

function reportIssues(issues: ReturnType<typeof validateStoryboard>): boolean {
  if (issues.length === 0) {
    console.log('Storyboard is valid.');
    return true;
  }
  for (const issue of issues) {
    const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN ';
    console.log(`[${prefix}] ${issue.message}`);
  }
  return !issues.some((issue) => issue.severity === 'error');
}

function main(): void {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (args.get('help')) {
    printUsage();
    return;
  }

  const storyboard = loadStoryboard(requireString(args, 'ir'));
  const issues = validateStoryboard(storyboard);

  if (command === 'validate') {
    const ok = reportIssues(issues);
    process.exit(ok ? 0 : 1);
  }

  // compile
  const blocking = issues.filter((issue) => issue.severity === 'error');
  if (blocking.length > 0) {
    reportIssues(issues);
    throw new Error('Refusing to compile an invalid storyboard.');
  }
  // Surface warnings but proceed.
  for (const warning of issues) {
    console.log(`[WARN ] ${warning.message}`);
  }

  const outPath = path.resolve(requireString(args, 'out'));
  if (fs.existsSync(outPath) && !args.get('force')) {
    throw new Error(`Output already exists (use --force to overwrite): ${outPath}`);
  }

  // --style overrides the storyboard's own style field, so one IR can be
  // compiled to whiteboard or presentation without editing the JSON.
  const styleOverride = args.get('style');
  const board = storyboard as Storyboard;
  const effectiveBoard =
    typeof styleOverride === 'string'
      ? { ...board, style: styleOverride as Storyboard['style'] }
      : board;

  const { code } = compileStoryboardToTsx(effectiveBoard);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, code, 'utf8');
  console.log(`Wrote composition to ${outPath}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`seqvio-generate failed: ${message}`);
  process.exit(1);
}
