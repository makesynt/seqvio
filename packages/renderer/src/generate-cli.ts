#!/usr/bin/env node
/**
 * seqvio-generate — deterministic Storyboard IR pipeline.
 *
 *   seqvio-generate plan-agent --input article.md --write-prompt task.md
 *   seqvio-generate validate --ir story.json
 *   seqvio-generate compile --ir story.json --out scene.tsx
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  compileStoryboardToTsx,
  validateStoryboard,
  type Storyboard,
} from '@seqvio/core';
import { formatAgentPlanningPrompt, type AgentPlanningOptions } from './agent-contract';

type CommandName = 'compile' | 'validate' | 'plan-agent';

function printUsage(): void {
  console.log(`Usage:
  seqvio-generate plan-agent --input <path> --write-prompt <path.md>
  seqvio-generate validate --ir <path>
  seqvio-generate compile --ir <path> --out <path.tsx>
  seqvio-generate --ir <path> --out <path.tsx>

Options:
  --input <path>                  Source content for plan-agent
  --write-prompt <path>           Write host-agent task markdown
  --ir <path>                     Path to storyboard IR JSON
  --out <path>                    Output TSX path
  --language <code>               zh | en | auto (default: auto)
  --domain <name>                 history | science | auto (default: auto)
  --max-scenes <n>                Target scene count for the host agent (default: 5)
  --json                          Print validation issues as JSON
  --force                         Overwrite an existing output file
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
  if (
    maybeCommand === 'validate' ||
    maybeCommand === 'compile' ||
    maybeCommand === 'plan-agent'
  ) {
    command = maybeCommand;
    tokens = rest;
  }

  const args = new Map<string, string | boolean>();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'help' || key === 'force' || key === 'json') {
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

function writeOutput(outPath: string, content: string, force: boolean): void {
  if (fs.existsSync(outPath) && !force) {
    throw new Error(`Output already exists (use --force to overwrite): ${outPath}`);
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, 'utf8');
}

function planningOptions(args: Map<string, string | boolean>): AgentPlanningOptions {
  return {
    language: String(args.get('language') ?? 'auto') as AgentPlanningOptions['language'],
    maxScenes: args.get('max-scenes') ? Number(args.get('max-scenes')) : 5,
    domain: String(args.get('domain') ?? 'auto') as AgentPlanningOptions['domain'],
  };
}

function reportIssues(
  issues: ReturnType<typeof validateStoryboard>,
  json: boolean
): boolean {
  const ok = !issues.some((issue) => issue.severity === 'error');
  if (json) {
    console.log(JSON.stringify({ ok, issues }, null, 2));
    return ok;
  }
  if (issues.length === 0) {
    console.log('Storyboard is valid.');
    return true;
  }
  for (const issue of issues) {
    const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN ';
    const pathText = issue.path ? `${issue.path}: ` : '';
    const suggestionText = issue.suggestion ? ` Suggestion: ${issue.suggestion}` : '';
    console.log(`[${prefix}] ${pathText}${issue.message}${suggestionText}`);
  }
  return ok;
}

async function main(): Promise<void> {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (args.get('help')) {
    printUsage();
    return;
  }

  if (command === 'plan-agent') {
    const inputPath = path.resolve(requireString(args, 'input'));
    const promptPath = path.resolve(requireString(args, 'write-prompt'));
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input not found: ${inputPath}`);
    }
    const content = fs.readFileSync(inputPath, 'utf8');
    const prompt = formatAgentPlanningPrompt(content, planningOptions(args));
    writeOutput(promptPath, prompt, Boolean(args.get('force')));
    console.log(`Wrote host-agent planning task to ${promptPath}`);
    console.log('Run the task in your agent, then validate and compile the returned IR.');
    return;
  }

  const storyboard = loadStoryboard(requireString(args, 'ir'));
  const issues = validateStoryboard(storyboard);

  if (command === 'validate') {
    const ok = reportIssues(issues, Boolean(args.get('json')));
    process.exit(ok ? 0 : 1);
  }

  const ok = reportIssues(issues, Boolean(args.get('json')));
  if (!ok) {
    throw new Error('Refusing to compile an invalid storyboard.');
  }

  const outPath = path.resolve(requireString(args, 'out'));
  const board = storyboard as Storyboard;
  const { code } = compileStoryboardToTsx(board);
  writeOutput(outPath, code, Boolean(args.get('force')));
  console.log(`Wrote composition to ${outPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`seqvio-generate failed: ${message}`);
  process.exit(1);
});
