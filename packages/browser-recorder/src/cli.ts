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
import { createRecorderServer } from './server';
import type { BrowserPipelineResult, PipelineProgress, TtsProvider } from './types';
import { validatePlan } from './validate';

interface CliIo {
  stdout(message: string): void;
  stderr(message: string): void;
}

interface ParsedArgs {
  command: 'serve' | 'record';
  values: Map<string, string | true>;
}

class CliUsageError extends Error {}

export interface BrowserCliDependencies {
  pipeline?: typeof runPipeline;
  now?: () => number;
}

const BOOLEAN_FLAGS = new Set(['help', 'version', 'json', 'withAudio', 'burnCaptions']);
const VALUE_FLAGS = new Set(['port', 'host', 'outputDir', 'output', 'plan', 'jobId', 'provider', 'voice', 'qaConfig']);

function defaultIo(): CliIo {
  return { stdout: console.log, stderr: console.error };
}

function usage(): string {
  return `Seqvio Browser Capture CLI (${CAPTURE_ADAPTER_LIFECYCLE}, contract ${CAPTURE_CLI_CONTRACT_VERSION})

Usage:
  seqvio-browser serve [--port 4175] [--host 127.0.0.1] [--outputDir <path>]
  seqvio-browser record --plan <plan.json> [--outputDir <path>] [--jobId <id>]

Options:
  --outputDir <path>     Job root (default: output/browser-recorder)
  --jobId <id>           Stable job directory name; generated when omitted
  --withAudio            Synthesize narration and mux it into the video
  --burnCaptions         Burn narration captions; requires --withAudio
  --provider <name>      elevenlabs | minimax | edge-tts | openai
  --voice <name>         Provider-specific voice id/name
  --qaConfig <path>      Versioned capture QA policy/suppressions
  --json                 Emit one machine-readable result on stdout
  --help                 Show this help
  --version              Show package and CLI contract versions

The legacy --output alias is accepted for serve and maps to --outputDir.`;
}

function packageVersion(): string {
  const packagePath = path.resolve(__dirname, '..', 'package.json');
  return (JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { version: string }).version;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith('--') ? args.shift() : 'serve';
  if (command !== 'serve' && command !== 'record') {
    throw new Error(`Unknown command "${command}"`);
  }
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
  return { command, values };
}

function stringValue(values: ParsedArgs['values'], name: string, fallback?: string): string | undefined {
  const value = values.get(name);
  return typeof value === 'string' ? value : fallback;
}

function outputRoot(values: ParsedArgs['values']): string {
  return path.resolve(
    stringValue(values, 'outputDir') ??
      stringValue(values, 'output') ??
      'output/browser-recorder'
  );
}

function parseProvider(value: string | undefined): TtsProvider | undefined {
  if (!value) return undefined;
  if (value === 'elevenlabs' || value === 'minimax' || value === 'edge-tts' || value === 'openai') return value;
  throw new Error(`Unsupported provider "${value}". Use one of: elevenlabs, minimax, edge-tts, openai.`);
}

function writeResult(io: CliIo, json: boolean, result: unknown, humanLines: string[]): void {
  if (json) {
    io.stdout(JSON.stringify(result));
    return;
  }
  humanLines.forEach((line) => io.stdout(line));
}

async function runServe(args: ParsedArgs, io: CliIo, json: boolean): Promise<number> {
  const portValue = stringValue(args.values, 'port', '4175')!;
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new CliUsageError('port must be an integer between 1 and 65535');
  }
  const host = stringValue(args.values, 'host', '127.0.0.1')!;
  const outputDir = outputRoot(args.values);
  const server = createRecorderServer({ port, host, outputDir });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve());
  });
  const result = {
    ok: true,
    cliContractVersion: CAPTURE_CLI_CONTRACT_VERSION,
    lifecycle: CAPTURE_ADAPTER_LIFECYCLE,
    adapter: 'browser',
    command: 'serve',
    url: `http://${host}:${port}`,
    outputDir,
  };
  writeResult(io, json, result, [
    `Seqvio Browser Recorder: http://${host}:${port}`,
    `Jobs: ${outputDir}`,
  ]);
  return CaptureCliExitCode.success;
}

export async function runBrowserCli(
  argv: string[],
  io: CliIo = defaultIo(),
  dependencies: BrowserCliDependencies = {}
): Promise<number> {
  const requestedJson = argv.includes('--json');
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failure = captureCliFailure({
      adapter: 'browser', exitCode: CaptureCliExitCode.usage,
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
      adapter: 'browser',
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
  if (parsed.command === 'serve') {
    try {
      if (['plan', 'jobId', 'withAudio', 'burnCaptions', 'provider', 'voice', 'qaConfig'].some((name) => parsed.values.has(name))) {
        throw new CliUsageError('recording, audio, and QA options are only valid with record');
      }
      if (parsed.values.has('outputDir') && parsed.values.has('output')) {
        throw new CliUsageError('Use only one of --outputDir or --output');
      }
      return await runServe(parsed, io, json);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const exitCode = error instanceof CliUsageError
        ? CaptureCliExitCode.usage
        : CaptureCliExitCode.pipeline;
      const failure = captureCliFailure({
        adapter: 'browser', exitCode,
        error: { code: exitCode === CaptureCliExitCode.usage ? 'invalid_input' : 'server_failed', message },
      });
      (json ? io.stdout : io.stderr)(json ? JSON.stringify(failure) : message);
      return exitCode;
    }
  }

  let jobId: string | undefined;
  let jobDir: string | undefined;
  try {
    const planPath = stringValue(parsed.values, 'plan');
    if (!planPath) throw new Error('record requires --plan <plan.json>');
    if (parsed.values.has('port') || parsed.values.has('host')) {
      throw new Error('--port and --host are only valid with serve');
    }
    if (parsed.values.has('outputDir') && parsed.values.has('output')) {
      throw new Error('Use only one of --outputDir or --output');
    }
    const plan = validatePlan(JSON.parse(fs.readFileSync(path.resolve(planPath), 'utf8')));
    const withAudio = parsed.values.has('withAudio');
    const audioProvider = parseProvider(stringValue(parsed.values, 'provider'));
    const audioVoice = stringValue(parsed.values, 'voice');
    if ((audioProvider || audioVoice) && !withAudio) throw new Error('--provider and --voice require --withAudio');
    if (parsed.values.has('burnCaptions') && !withAudio) throw new Error('--burnCaptions requires --withAudio');
    jobId = validateCaptureJobId(
      stringValue(parsed.values, 'jobId') ?? createCaptureJobId(dependencies.now?.())
    );
    const candidateJobDir = path.join(outputRoot(parsed.values), jobId);
    if (fs.existsSync(candidateJobDir) && fs.readdirSync(candidateJobDir).length > 0) {
      throw new Error(`Job directory already exists and is not empty: ${candidateJobDir}`);
    }
    jobDir = candidateJobDir;
    fs.mkdirSync(jobDir, { recursive: true });
    const onProgress = (progress: PipelineProgress) => {
      const message = `[${progress.phase}] ${Math.round(progress.percent)}% - ${progress.message}`;
      (json ? io.stderr : io.stdout)(message);
    };
    const result: BrowserPipelineResult = await (dependencies.pipeline ?? runPipeline)(
      plan, jobDir, onProgress, {
        withAudio,
        burnCaptions: parsed.values.has('burnCaptions'),
        audioProvider,
        audioVoice,
        qaConfig: stringValue(parsed.values, 'qaConfig'),
      }
    );
    const success = captureCliSuccess({
      adapter: 'browser', jobId, jobDir,
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
        adapter: 'browser', status: 'failed',
        artifacts: collectCaptureArtifacts(jobDir, 'browser'),
        error: { code: 'pipeline_failed', message },
      });
    }
    const failure = captureCliFailure({
      adapter: 'browser', exitCode,
      error: { code: pipelineStarted ? 'pipeline_failed' : 'invalid_input', message },
      jobId, jobDir, artifactManifestPath,
    });
    (json ? io.stdout : io.stderr)(json ? JSON.stringify(failure) : message);
    return exitCode;
  }
}

if (require.main === module) {
  runBrowserCli(process.argv.slice(2)).then(
    (exitCode) => { process.exit(exitCode); },
    (error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(CaptureCliExitCode.internal);
    }
  );
}
