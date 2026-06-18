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

type CommandName = 'compile' | 'validate' | 'plan-agent' | 'frame-spec';

function printUsage(): void {
  console.log(`Usage:
  seqvio-generate plan-agent --input <path> --write-prompt <path.md>
  seqvio-generate validate --ir <path>
  seqvio-generate compile --ir <path> --out <path.tsx>
  seqvio-generate --ir <path> --out <path.tsx>
  seqvio-generate frame-spec init [--style <name>] [--width n] [--height n] [--out <path>]

Options:
  --input <path>                  Source content for plan-agent
  --write-prompt <path>           Write host-agent task markdown
  --ir <path>                     Path to storyboard IR JSON
  --out <path>                    Output TSX or FRAME.md path
  --language <code>               zh | en | auto (default: auto)
  --domain <name>                 history | science | auto (default: auto)
  --max-scenes <n>                Target scene count for the host agent (default: 5)
  --json                          Print validation issues as JSON
  --force                         Overwrite an existing output file
  --style <name>                  frame-spec style: whiteboard/default | whiteboard/studio |
                                  whiteboard/field-note | scatterbrain (default: whiteboard/default)
  --width <n>                     Canvas width for frame-spec (default: 1920)
  --height <n>                    Canvas height for frame-spec (default: 1080)
  --help
`);
}

function parseArgs(argv: string[]): {
  command: CommandName;
  subcommand?: string;
  args: Map<string, string | boolean>;
} {
  const [maybeCommand, ...rest] = argv;
  let command: CommandName = 'compile';
  let subcommand: string | undefined;
  let tokens = argv;
  if (
    maybeCommand === 'validate' ||
    maybeCommand === 'compile' ||
    maybeCommand === 'plan-agent'
  ) {
    command = maybeCommand;
    tokens = rest;
  } else if (maybeCommand === 'frame-spec') {
    command = 'frame-spec';
    const [maybeSub, ...afterSub] = rest;
    if (maybeSub && !maybeSub.startsWith('--')) {
      subcommand = maybeSub;
      tokens = afterSub;
    } else {
      tokens = rest;
    }
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
  return { command, subcommand, args };
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

// ---------------------------------------------------------------------------
// frame-spec helpers
// ---------------------------------------------------------------------------

const FRAME_SPEC_STYLES: Record<string, {
  description: string;
  background: string;
  colors: Record<string, string>;
  typeScale: Record<string, string>;
  spacing: Record<string, string>;
  fontStack: string;
  notes: string;
}> = {
  'whiteboard/default': {
    description: 'Clean stroke-first whiteboard look with soft background',
    background: '#f8f9fb',
    colors: {
      ink: '#2c3e50',
      accent: '#3498db',
      accent2: '#27ae60',
      muted: '#7f8c8d',
      surface: '#ffffff',
      cta: '#e74c3c',
    },
    typeScale: {
      display: '96 px (hero title, one per scene)',
      h1: '64 px (section heading)',
      h2: '46 px (card/panel heading)',
      body: '32 px (explanation text, list items)',
      caption: '24 px (labels, annotations)',
    },
    spacing: {
      padX: '80 px',
      padY: '60 px',
      gapLg: '64 px',
      gapMd: '36 px',
      gapSm: '18 px',
    },
    fontStack:
      '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", system-ui, sans-serif',
    notes: 'DrawText defaults: textRender=fill. DrawShape defaults: shapeFillDefault=wash.',
  },
  'whiteboard/studio': {
    description: 'Dark-background presentation look (charcoal + cool accent)',
    background: '#1a1a2e',
    colors: {
      ink: '#e8eaed',
      accent: '#4fc3f7',
      accent2: '#81c784',
      muted: '#9aa0a6',
      surface: '#2d2d44',
      cta: '#ef5350',
    },
    typeScale: {
      display: '96 px',
      h1: '64 px',
      h2: '46 px',
      body: '32 px',
      caption: '24 px',
    },
    spacing: {
      padX: '80 px',
      padY: '60 px',
      gapLg: '64 px',
      gapMd: '36 px',
      gapSm: '18 px',
    },
    fontStack:
      '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", system-ui, sans-serif',
    notes:
      'Use <Whiteboard theme="studio"> or a custom theme with background="#1a1a2e".',
  },
  'whiteboard/field-note': {
    description: 'Warm paper + natural ink field-note look',
    background: '#faf8f3',
    colors: {
      ink: '#2c1810',
      accent: '#c0392b',
      accent2: '#2980b9',
      muted: '#7d6f62',
      surface: '#faf8f3',
      cta: '#e67e22',
    },
    typeScale: {
      display: '96 px',
      h1: '64 px',
      h2: '46 px',
      body: '32 px',
      caption: '24 px',
    },
    spacing: {
      padX: '80 px',
      padY: '60 px',
      gapLg: '64 px',
      gapMd: '36 px',
      gapSm: '18 px',
    },
    fontStack:
      '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", system-ui, sans-serif',
    notes:
      'Use textRender="stroke-wash" for a natural ink feel. strokeWidth: 2.5, strokeWidthBold: 4.',
  },
  scatterbrain: {
    description: 'Cork-board sticky-note layout with CSS div elements',
    background: '#c8a96e (cork) or #f2e8d5 (linen)',
    colors: {
      'sticky-yellow': '#fef08a',
      'sticky-blue': '#bfdbfe',
      'sticky-pink': '#fecdd3',
      'sticky-green': '#bbf7d0',
      'scrawl-ink': '#1e293b',
    },
    typeScale: {
      display: '64 px',
      h1: '48 px',
      h2: '36 px',
      body: '28 px',
      caption: '20 px',
    },
    spacing: {
      padX: '80 px',
      padY: '60 px',
      gapLg: '48 px',
      gapMd: '24 px',
      gapSm: '12 px',
    },
    fontStack: '"Segoe Print", "Comic Sans MS", cursive',
    notes:
      'Elements use position:absolute px coordinates. Rotation ±2°–±5° for natural feel. Use @seqvio/scatterbrain package.',
  },
};

function generateFrameSpec(opts: {
  width: number;
  height: number;
  style: string;
}): string {
  const def = FRAME_SPEC_STYLES[opts.style];
  if (!def) {
    throw new Error(
      `Unknown style "${opts.style}". Valid styles: ${Object.keys(FRAME_SPEC_STYLES).join(', ')}`
    );
  }

  const colorTable = Object.entries(def.colors)
    .map(([k, v]) => `| ${k} | \`${v}\` |`)
    .join('\n');
  const typeTable = Object.entries(def.typeScale)
    .map(([k, v]) => `| \`${k}\` | ${v} |`)
    .join('\n');
  const spacingTable = Object.entries(def.spacing)
    .map(([k, v]) => `| \`${k}\` | ${v} |`)
    .join('\n');

  const safeX = Math.round(opts.width * 0.042);
  const safeY = Math.round(opts.height * 0.056);

  return `---
canvas:
  width: ${opts.width}
  height: ${opts.height}
  safeZone:
    top: ${safeY}
    right: ${safeX}
    bottom: ${safeY}
    left: ${safeX}
style: ${opts.style}
---

# Seqvio Frame Specification

Style: **${opts.style}** — ${def.description}

---

## Canvas

| Property | Value |
|----------|-------|
| Width | ${opts.width} px |
| Height | ${opts.height} px |
| Safe zone top/bottom | ${safeY} px |
| Safe zone left/right | ${safeX} px |
| Background | \`${def.background}\` |

---

## Type Scale

All sizes are CSS pixels at ${opts.width} × ${opts.height}.

| Token | Size / Use |
|-------|-----------|
${typeTable}

---

## Spacing

| Token | Value |
|-------|-------|
${spacingTable}

---

## Color Palette

| Role | Value |
|------|-------|
${colorTable}

---

## Font Stack

\`${def.fontStack}\`

---

## Style Notes

${def.notes}

---

## Authoring Checklist for AI Agents

1. Read this file before placing any element.
2. Pick positions from the spacing grid tokens.
3. Pick font sizes from the type scale — never invent ad-hoc sizes.
4. Pick colors from the palette — never invent ad-hoc hex values.
5. Keep all text within the safe zone.
6. Use \`display\` only once per scene.
`;
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { command, subcommand, args } = parseArgs(process.argv.slice(2));
  if (args.get('help')) {
    printUsage();
    return;
  }

  if (command === 'frame-spec') {
    if (subcommand !== 'init') {
      throw new Error('Usage: seqvio-generate frame-spec init [--style <name>] [--out <path>]');
    }
    const styleName = String(args.get('style') ?? 'whiteboard/default');
    const width = args.get('width') ? Number(args.get('width')) : 1920;
    const height = args.get('height') ? Number(args.get('height')) : 1080;
    const outPath = args.get('out')
      ? path.resolve(String(args.get('out')))
      : path.join(process.cwd(), 'FRAME.md');
    const content = generateFrameSpec({ width, height, style: styleName });
    writeOutput(outPath, content, Boolean(args.get('force')));
    console.log(`Wrote frame spec to ${outPath}`);
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
