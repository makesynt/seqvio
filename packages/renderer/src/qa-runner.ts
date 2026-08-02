import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface CaptureQaOptions {
  component: string;
  outDir: string;
  captureManifest: string;
  audioManifest?: string;
  width: number;
  height: number;
  fps: number;
  qaConfig?: string;
  warningsAsErrors?: string[];
  requireNarrationAudio?: boolean;
  onOutput?: (message: string) => void;
}

export interface CaptureQaResult {
  reportPath: string;
  report: Record<string, unknown>;
}

export async function runCaptureQa(options: CaptureQaOptions): Promise<CaptureQaResult> {
  const qaCli = path.join(__dirname, 'qa-cli.js');
  if (!fs.existsSync(qaCli)) {
    throw new Error(`seqvio-qa CLI not found at ${qaCli}. Build @seqvio/renderer first.`);
  }
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const args = [
    qaCli,
    '--component', path.resolve(options.component),
    '--outDir', outDir,
    '--profile', 'capture',
    '--captureManifest', path.resolve(options.captureManifest),
    '--width', String(options.width),
    '--height', String(options.height),
    '--fps', String(options.fps),
    '--ci',
  ];
  if (options.audioManifest) args.push('--audioManifest', path.resolve(options.audioManifest));
  if (options.requireNarrationAudio === false) args.push('--allowSilentNarration');
  if (options.qaConfig) args.push('--qaConfig', path.resolve(options.qaConfig));
  if (options.warningsAsErrors?.length) {
    args.push('--warningsAsErrors', options.warningsAsErrors.join(','));
  }

  const reportPath = path.join(outDir, 'qa-report.json');
  const child = execFile(process.execPath, args, {
    cwd: path.dirname(path.resolve(options.component)),
    maxBuffer: 10 * 1024 * 1024,
  });
  child.stdout?.on('data', (chunk) => options.onOutput?.(String(chunk).trim()));
  child.stderr?.on('data', (chunk) => options.onOutput?.(String(chunk).trim()));
  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
  if (!fs.existsSync(reportPath)) {
    throw new Error(`seqvio-qa did not write ${reportPath}`);
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Record<string, unknown>;
  if (exitCode !== 0 || report.ok !== true) {
    const issueCount = Array.isArray(report.issues) ? report.issues.length : 0;
    throw new Error(`Capture QA failed with ${issueCount} active issue(s). See ${reportPath}`);
  }
  return { reportPath, report };
}
