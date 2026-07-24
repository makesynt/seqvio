#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';

import { runPipeline } from './pipeline';
import { validatePlan } from './validate';
import { sampleClaudePlan, samplePlan } from './sample';
import type { TtsProvider } from './types';

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function readFlag(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : fallback;
}

function requireFlag(name: string): string {
  const value = readFlag(name);
  if (!value) {
    throw new Error(`Missing required flag: ${name}`);
  }
  return value;
}

function parseProvider(value: string | undefined): TtsProvider | undefined {
  if (!value) return undefined;
  if (
    value === 'elevenlabs' ||
    value === 'minimax' ||
    value === 'edge-tts' ||
    value === 'openai'
  ) {
    return value;
  }
  throw new Error(
    `Unsupported provider "${value}". Use one of: elevenlabs, minimax, edge-tts, openai.`
  );
}

function printUsage(): void {
  console.error(`Usage:
  seqvio-terminal-narrator record --plan <plan.json> [options]
  seqvio-terminal-narrator record --sample [options]
  seqvio-terminal-narrator record --sample-claude [options]

Options:
  --outputDir <path>     Output directory (default: output/terminal-narrator)
  --withAudio            Synthesize narration
  --provider <name>      elevenlabs | minimax | edge-tts | openai (default: edge-tts)
  --voice <name>         Provider-specific voice id/name
  --skill <text>         Skill invocation for --sample-claude (default: /help)
  --claudeBin <path>     Claude Code binary (default: CLAUDE_BIN or claude)
  --cwd <path>           Working directory for --sample-claude
`);
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'record';
  const outputDir = path.resolve(readFlag('--outputDir', 'output/terminal-narrator')!);
  const withAudio = hasFlag('--withAudio');
  const audioProvider = parseProvider(readFlag('--provider'));
  const audioVoice = readFlag('--voice');

  if (command !== 'record') {
    printUsage();
    process.exit(1);
  }

  const planPath = readFlag('--plan');
  const useSample = hasFlag('--sample');
  const useSampleClaude = hasFlag('--sample-claude');

  if (!planPath && !useSample && !useSampleClaude) {
    printUsage();
    throw new Error('Either --plan, --sample, or --sample-claude is required');
  }
  if ([Boolean(planPath), useSample, useSampleClaude].filter(Boolean).length > 1) {
    throw new Error('Use only one of --plan, --sample, or --sample-claude');
  }

  const plan = useSampleClaude
    ? sampleClaudePlan({
        skill: readFlag('--skill'),
        claudeBin: readFlag('--claudeBin'),
        cwd: readFlag('--cwd'),
      })
    : useSample
      ? samplePlan()
      : (JSON.parse(fs.readFileSync(path.resolve(requireFlag('--plan')), 'utf8')) as unknown);

  const validated = validatePlan(plan);

  fs.mkdirSync(outputDir, { recursive: true });
  const jobId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const jobDir = path.join(outputDir, jobId);

  const result = await runPipeline(
    validated,
    jobDir,
    (progress) => {
      const pct = Math.round(progress.percent);
      console.log(`[${progress.phase}] ${pct}% - ${progress.message}`);
    },
    {
      withAudio,
      audioProvider,
      audioVoice,
    }
  );

  console.log('');
  console.log(`Job: ${jobId}`);
  console.log(`Engine: ${result.engine}`);
  console.log(`Manifest: ${result.manifestPath}`);
  console.log(`Cast: ${result.castPath}`);
  if (result.componentPath) console.log(`Component: ${result.componentPath}`);
  if (result.audioManifestPath) console.log(`Audio manifest: ${result.audioManifestPath}`);
  if (result.resolvedAudioManifestPath) {
    console.log(`Resolved audio: ${result.resolvedAudioManifestPath}`);
  }
  console.log(`Video: ${result.outputVideoPath}`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
);
