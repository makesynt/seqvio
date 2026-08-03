import * as fs from 'node:fs';
import * as path from 'node:path';

export const CAPTURE_CLI_CONTRACT_VERSION = '2.0' as const;
export const CAPTURE_ADAPTER_LIFECYCLE = 'pre-stable' as const;
export const CAPTURE_ARTIFACT_MANIFEST_VERSION = '1.0' as const;

export const CaptureCliExitCode = {
  success: 0,
  usage: 2,
  pipeline: 3,
  internal: 4,
} as const;

export type CaptureCliExitCodeValue =
  (typeof CaptureCliExitCode)[keyof typeof CaptureCliExitCode];

export function createCaptureJobId(now = Date.now()): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function validateCaptureJobId(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value)) {
    throw new Error(
      'jobId must be 1-64 characters using letters, numbers, dot, underscore, or hyphen'
    );
  }
  return value;
}

export type CaptureArtifactKind =
  | 'plan'
  | 'recordingManifest'
  | 'captureManifest'
  | 'explainerDocument'
  | 'component'
  | 'audioManifest'
  | 'resolvedAudioManifest'
  | 'sourceVideo'
  | 'cast'
  | 'outputVideo'
  | 'qaReport';

export interface CaptureArtifactManifest {
  version: typeof CAPTURE_ARTIFACT_MANIFEST_VERSION;
  cliContractVersion: typeof CAPTURE_CLI_CONTRACT_VERSION;
  lifecycle: typeof CAPTURE_ADAPTER_LIFECYCLE;
  adapter: 'terminal' | 'browser';
  jobId: string;
  createdAt: string;
  status: 'complete' | 'failed';
  artifacts: Partial<Record<CaptureArtifactKind, string>>;
  error?: { code: string; message: string };
}

export interface WriteCaptureArtifactManifestOptions {
  adapter: CaptureArtifactManifest['adapter'];
  jobId?: string;
  status: CaptureArtifactManifest['status'];
  artifacts?: Partial<Record<CaptureArtifactKind, string | undefined>>;
  error?: CaptureArtifactManifest['error'];
  createdAt?: string;
}

function portableArtifactPath(jobDir: string, artifactPath: string): string {
  const relative = path.relative(jobDir, path.resolve(artifactPath));
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Artifact path must be inside the job directory: ${artifactPath}`);
  }
  return relative.replace(/\\/g, '/');
}

export function writeCaptureArtifactManifest(
  jobDir: string,
  options: WriteCaptureArtifactManifestOptions
): string {
  const resolvedJobDir = path.resolve(jobDir);
  fs.mkdirSync(resolvedJobDir, { recursive: true });
  const artifacts = Object.fromEntries(
    Object.entries(options.artifacts ?? {})
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([kind, artifactPath]) => [
        kind,
        portableArtifactPath(resolvedJobDir, artifactPath),
      ])
  ) as CaptureArtifactManifest['artifacts'];
  const manifest: CaptureArtifactManifest = {
    version: CAPTURE_ARTIFACT_MANIFEST_VERSION,
    cliContractVersion: CAPTURE_CLI_CONTRACT_VERSION,
    lifecycle: CAPTURE_ADAPTER_LIFECYCLE,
    adapter: options.adapter,
    jobId: options.jobId ?? path.basename(resolvedJobDir),
    createdAt: options.createdAt ?? new Date().toISOString(),
    status: options.status,
    artifacts,
    error: options.error,
  };
  const outputPath = path.join(resolvedJobDir, 'artifacts.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return outputPath;
}

export function collectCaptureArtifacts(
  jobDir: string,
  adapter: CaptureArtifactManifest['adapter']
): Partial<Record<CaptureArtifactKind, string>> {
  const candidates: Partial<Record<CaptureArtifactKind, string>> = {
    plan: path.join(jobDir, 'plan.json'),
    recordingManifest: path.join(jobDir, 'recording-manifest.json'),
    captureManifest: path.join(jobDir, 'capture-manifest.json'),
    explainerDocument: path.join(jobDir, 'explainer.json'),
    component: path.join(jobDir, 'composition.tsx'),
    audioManifest: path.join(jobDir, 'audio-manifest.json'),
    resolvedAudioManifest: path.join(jobDir, 'audio-manifest.resolved.json'),
    outputVideo: path.join(jobDir, 'final.mp4'),
    qaReport: path.join(jobDir, 'qa-report.json'),
    ...(adapter === 'terminal'
      ? { cast: path.join(jobDir, 'session.cast') }
      : { sourceVideo: path.join(jobDir, 'raw.mp4') }),
  };
  return Object.fromEntries(
    Object.entries(candidates).filter((entry): entry is [string, string] =>
      typeof entry[1] === 'string' && fs.existsSync(entry[1])
    )
  ) as Partial<Record<CaptureArtifactKind, string>>;
}

export interface CaptureCliSuccess {
  ok: true;
  cliContractVersion: typeof CAPTURE_CLI_CONTRACT_VERSION;
  lifecycle: typeof CAPTURE_ADAPTER_LIFECYCLE;
  adapter: CaptureArtifactManifest['adapter'];
  jobId: string;
  jobDir: string;
  artifactManifestPath: string;
  outputVideoPath: string;
}

export interface CaptureCliFailure {
  ok: false;
  cliContractVersion: typeof CAPTURE_CLI_CONTRACT_VERSION;
  lifecycle: typeof CAPTURE_ADAPTER_LIFECYCLE;
  adapter: CaptureArtifactManifest['adapter'];
  exitCode: CaptureCliExitCodeValue;
  error: { code: string; message: string };
  jobId?: string;
  jobDir?: string;
  artifactManifestPath?: string;
}

export function captureCliSuccess(
  input: Omit<CaptureCliSuccess, 'ok' | 'cliContractVersion' | 'lifecycle'>
): CaptureCliSuccess {
  return {
    ok: true,
    cliContractVersion: CAPTURE_CLI_CONTRACT_VERSION,
    lifecycle: CAPTURE_ADAPTER_LIFECYCLE,
    ...input,
  };
}

export function captureCliFailure(
  input: Omit<CaptureCliFailure, 'ok' | 'cliContractVersion' | 'lifecycle'>
): CaptureCliFailure {
  return {
    ok: false,
    cliContractVersion: CAPTURE_CLI_CONTRACT_VERSION,
    lifecycle: CAPTURE_ADAPTER_LIFECYCLE,
    ...input,
  };
}
