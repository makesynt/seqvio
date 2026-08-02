#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  CAPTURE_ADAPTER_LIFECYCLE,
  CAPTURE_CLI_CONTRACT_VERSION,
  CaptureCliExitCode,
  captureCliFailure,
  captureCliSuccess,
  collectCaptureArtifacts,
  createCaptureJobId,
  validateCaptureJobId,
  writeCaptureArtifactManifest,
} from '@seqvio/capture';
import { runPipeline } from './pipeline';
import { sampleClaudePlan, samplePlan } from './sample';
import type { PipelineProgress, PipelineResult, TtsProvider } from './types';
import { validatePlan } from './validate';

interface CliIo {
  stdout(message: string): void;
  stderr(message: string): void;
}

interface ParsedArgs {
  command: 'record';
  values: Map<string, string | true>;
}

export interface TerminalCliDependencies {
  pipeline?: typeof runPipeline;
  now?: () => number;
}

const BOOLEAN_FLAGS = new Set([
  'help', 'version', 'json', 'sample', 'sample-claude', 'withAudio', 'burnCaptions',
]);
const VALUE_FLAGS = new Set([
  'plan', 'outputDir', 'provider', 'voice', 'skill', 'claudeBin', 'cwd', 'jobId', 'qaConfig',
]);

function defaultIo(): CliIo {
  return { stdout: console.log, stderr: console.error };
}

function usage(): string {
  return `Seqvio Terminal Capture CLI (${CAPTURE_ADAPTER_LIFECYCLE}, contract ${CAPTURE_CLI_CONTRACT_VERSION})

Usage:
  seqvio-terminal record --plan <plan.json> [options]
  seqvio-terminal record --sample [options]
  seqvio-terminal record --sample-claude [options]

Options:
  --outputDir <path>     Job root (default: output/terminal-narrator)
  --jobId <id>           Stable job directory name; generated when omitted
  --withAudio            Synthesize narration and mux it into the video
  --burnCaptions         Burn narration captions; requires --withAudio
  --provider <name>      elevenlabs | minimax | edge-tts | openai
  --voice <name>         Provider-specific voice id/name
  --qaConfig <path>      Versioned capture QA policy/suppressions
  --skill <text>         Skill invocation for --sample-claude (default: /help)
  --claudeBin <path>     Claude Code binary (default: CLAUDE_BIN or claude)
  --cwd <path>           Working directory for --sample-claude
  --json                 Emit one machine-readable result on stdout
  --help                 Show this help
  --version              Show package and CLI contract versions`;
}

function packageVersion(): string {
  const packagePath = path.resolve(__dirname, '..', 'package.json');
  return (JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { version: string }).version;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith('--') ? args.shift() : 'record';
  if (command !== 'record') throw new Error(`Unknown command "${command}"`);
  const values = new Map<string, string | true>();
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument "${token}"`);
    const name = token.slice(2);
    if (values.has(name)) throw new Error(`Duplicate option "--${name}"`);
    if (BOOLEAN_FLAGS.has(name)) {
      values.set(name, true);
      continue;
    }
    if (!VALUE_FLAGS.has(name)) throw new Error(`Unknown option "--${name}"`);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${name}`);
    values.set(name, value);
    index += 1;
  }
  return { command: 'record', values };
}

function stringValue(values: ParsedArgs['values'], name: string, fallback?: string): string | undefined {
  const value = values.get(name);
  return typeof value === 'string' ? value : fallback;
}

function parseProvider(value: string | undefined): TtsProvider | undefined {
  if (!value) return undefined;
  if (value === 'elevenlabs' || value === 'minimax' || value === 'edge-tts' || value === 'openai') {
    return value;
  }
  throw new Error(
    `Unsupported provider "${value}". Use one of: elevenlabs, minimax, edge-tts, openai.`
  );
}

function writeResult(io: CliIo, json: boolean, result: unknown, humanLines: string[]): void {
  if (json) {
    io.stdout(JSON.stringify(result));
    return;
  }
  humanLines.forEach((line) => io.stdout(line));
}

export async function runTerminalCli(
  argv: string[],
  io: CliIo = defaultIo(),
  dependencies: TerminalCliDependencies = {}
): Promise<number> {
  const requestedJson = argv.includes('--json');
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failure = captureCliFailure({
      adapter: 'terminal', exitCode: CaptureCliExitCode.usage,
      error: { code: 'invalid_arguments', message },
    });
    if (requestedJson) io.stdout(JSON.stringify(failure));
    else {
      io.stderr(message);
      io.stderr(usage());
    }
    return CaptureCliExitCode.usage;
  }

  const json = parsed.values.has('json');
  if (parsed.values.has('help')) {
    writeResult(io, json, {
      ok: true,
      cliContractVersion: CAPTURE_CLI_CONTRACT_VERSION,
      lifecycle: CAPTURE_ADAPTER_LIFECYCLE,
      adapter: 'terminal',
      command: 'help',
      usage: usage(),
    }, [usage()]);
    return CaptureCliExitCode.success;
  }
  if (parsed.values.has('version')) {
    writeResult(io, json, {
      packageVersion: packageVersion(),
      cliContractVersion: CAPTURE_CLI_CONTRACT_VERSION,
      lifecycle: CAPTURE_ADAPTER_LIFECYCLE,
    }, [`${packageVersion()} (CLI contract ${CAPTURE_CLI_CONTRACT_VERSION}, ${CAPTURE_ADAPTER_LIFECYCLE})`]);
    return CaptureCliExitCode.success;
  }

  let jobId: string | undefined;
  let jobDir: string | undefined;
  try {
    const planPath = stringValue(parsed.values, 'plan');
    const useSample = parsed.values.has('sample');
    const useSampleClaude = parsed.values.has('sample-claude');
    if ([Boolean(planPath), useSample, useSampleClaude].filter(Boolean).length !== 1) {
      throw new Error('Use exactly one of --plan, --sample, or --sample-claude');
    }
    const plan = useSampleClaude
      ? sampleClaudePlan({
          skill: stringValue(parsed.values, 'skill'),
          claudeBin: stringValue(parsed.values, 'claudeBin'),
          cwd: stringValue(parsed.values, 'cwd'),
        })
      : useSample
        ? samplePlan()
        : JSON.parse(fs.readFileSync(path.resolve(planPath!), 'utf8'));
    const validated = validatePlan(plan);
    const audioProvider = parseProvider(stringValue(parsed.values, 'provider'));
    const audioVoice = stringValue(parsed.values, 'voice');
    if ((audioProvider || audioVoice) && !parsed.values.has('withAudio')) {
      throw new Error('--provider and --voice require --withAudio');
    }
    if (parsed.values.has('burnCaptions') && !parsed.values.has('withAudio')) {
      throw new Error('--burnCaptions requires --withAudio');
    }
    if ((parsed.values.has('skill') || parsed.values.has('claudeBin') || parsed.values.has('cwd')) && !useSampleClaude) {
      throw new Error('--skill, --claudeBin, and --cwd require --sample-claude');
    }
    const outputDir = path.resolve(
      stringValue(parsed.values, 'outputDir', 'output/terminal-narrator')!
    );
    jobId = validateCaptureJobId(
      stringValue(parsed.values, 'jobId') ?? createCaptureJobId(dependencies.now?.())
    );
    const candidateJobDir = path.join(outputDir, jobId);
    if (fs.existsSync(candidateJobDir) && fs.readdirSync(candidateJobDir).length > 0) {
      throw new Error(`Job directory already exists and is not empty: ${candidateJobDir}`);
    }
    jobDir = candidateJobDir;
    fs.mkdirSync(jobDir, { recursive: true });
    const onProgress = (progress: PipelineProgress) => {
      const message = `[${progress.phase}] ${Math.round(progress.percent)}% - ${progress.message}`;
      (json ? io.stderr : io.stdout)(message);
    };
    const result: PipelineResult = await (dependencies.pipeline ?? runPipeline)(
      validated,
      jobDir,
      onProgress,
      {
        withAudio: parsed.values.has('withAudio'),
        burnCaptions: parsed.values.has('burnCaptions'),
        audioProvider,
        audioVoice,
        qaConfig: stringValue(parsed.values, 'qaConfig'),
      }
    );
    const success = captureCliSuccess({
      adapter: 'terminal', jobId, jobDir,
      artifactManifestPath: result.artifactManifestPath,
      outputVideoPath: result.outputVideoPath,
    });
    writeResult(io, json, success, [
      `Job: ${jobId}`,
      `Artifacts: ${result.artifactManifestPath}`,
      `Video: ${result.outputVideoPath}`,
    ]);
    return CaptureCliExitCode.success;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const pipelineStarted = Boolean(jobDir);
    const exitCode = pipelineStarted ? CaptureCliExitCode.pipeline : CaptureCliExitCode.usage;
    let artifactManifestPath: string | undefined;
    if (jobDir && jobId) {
      artifactManifestPath = writeCaptureArtifactManifest(jobDir, {
        adapter: 'terminal', status: 'failed',
        artifacts: collectCaptureArtifacts(jobDir, 'terminal'),
        error: { code: 'pipeline_failed', message },
      });
    }
    const failure = captureCliFailure({
      adapter: 'terminal', exitCode,
      error: { code: pipelineStarted ? 'pipeline_failed' : 'invalid_input', message },
      jobId, jobDir, artifactManifestPath,
    });
    (json ? io.stdout : io.stderr)(json ? JSON.stringify(failure) : message);
    return exitCode;
  }
}

if (require.main === module) {
  runTerminalCli(process.argv.slice(2)).then(
    (exitCode) => { process.exit(exitCode); },
    (error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(CaptureCliExitCode.internal);
    }
  );
}
