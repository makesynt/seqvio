export interface AutoWorkerInput {
  totalFrames: number;
  cpuCount: number;
  measuredP95Ms?: number;
  requestedMaxWorkers?: number;
}

export interface StaticReuseInput {
  previousOutputIndex: number | null;
  outputIndex: number;
  previousSignature: string | null;
  signature: string | null;
  signatureReusable: boolean;
}

const DEFAULT_JPEG_QUALITY = 90;
const MIN_JPEG_QUALITY = 30;
const MAX_JPEG_QUALITY = 100;

export function normalizeJpegQuality(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_JPEG_QUALITY;
  return Math.max(MIN_JPEG_QUALITY, Math.min(MAX_JPEG_QUALITY, Math.round(value)));
}

export function resolveAutoWorkers(input: AutoWorkerInput): number {
  const totalFrames = Math.max(0, Math.floor(input.totalFrames));
  const cpuCount = Math.max(1, Math.floor(input.cpuCount));
  const maxWorkers = Math.max(
    1,
    Math.min(input.requestedMaxWorkers ?? 8, cpuCount, Math.floor(totalFrames / 30) || 1)
  );

  if (totalFrames < 120) return 1;

  const baseline = Math.max(1, Math.min(maxWorkers, Math.ceil(cpuCount / 3)));
  const measuredP95Ms = input.measuredP95Ms;
  if (!measuredP95Ms || measuredP95Ms <= 300) return baseline;

  const costMultiplier = Math.max(1, Math.min(4, measuredP95Ms / 450));
  return Math.max(1, Math.min(maxWorkers, Math.floor(baseline / costMultiplier)));
}

export function shouldReuseStaticFrame(input: StaticReuseInput): boolean {
  if (!input.signatureReusable) return false;
  if (input.previousOutputIndex === null) return false;
  if (input.previousOutputIndex + 1 !== input.outputIndex) return false;
  if (!input.previousSignature || !input.signature) return false;
  return input.previousSignature === input.signature;
}
