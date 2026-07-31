import type { BrowserCaptureManifest, CaptureManifest, TerminalCaptureManifest } from './types';

export interface CaptureSecurityFinding {
  severity: 'error' | 'warning';
  code: 'credential_like_value' | 'sensitive_url_parameter' | 'private_key_material';
  path: string;
  detector: string;
  message: string;
}

const detectors: Array<{
  code: CaptureSecurityFinding['code'];
  detector: string;
  pattern: RegExp;
  message: string;
}> = [
  {
    code: 'private_key_material',
    detector: 'private-key-header',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
    message: 'Capture contains private-key material.',
  },
  {
    code: 'credential_like_value',
    detector: 'provider-token',
    pattern: /\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._~+/=-]{16,})\b/i,
    message: 'Capture contains a credential-like token.',
  },
  {
    code: 'credential_like_value',
    detector: 'secret-assignment',
    pattern: /\b(?:api[_-]?key|access[_-]?token|password|passwd|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i,
    message: 'Capture contains a secret-like assignment.',
  },
  {
    code: 'sensitive_url_parameter',
    detector: 'sensitive-query-parameter',
    pattern: /[?&](?:token|access_token|api[_-]?key|password|secret)=/i,
    message: 'Capture URL contains a sensitive query parameter.',
  },
];

function scan(value: string, pathName: string, findings: CaptureSecurityFinding[]): void {
  for (const detector of detectors) {
    if (detector.pattern.test(value)) {
      findings.push({
        severity:
          detector.code === 'sensitive_url_parameter' ? 'warning' : 'error',
        code: detector.code,
        path: pathName,
        detector: detector.detector,
        message: detector.message,
      });
    }
    detector.pattern.lastIndex = 0;
  }
}

export function scanCaptureManifestForSecrets(manifest: CaptureManifest): CaptureSecurityFinding[] {
  const findings: CaptureSecurityFinding[] = [];
  scan(manifest.name, 'name', findings);
  if (manifest.kind === 'terminal') {
    scanTerminal(manifest, findings);
  } else {
    scanBrowser(manifest, findings);
  }
  for (const [index, step] of manifest.steps.entries()) {
    scan(step.label, `steps[${index}].label`, findings);
    if (step.capturedState?.kind === 'terminal') {
      if (step.capturedState.stdout) scan(step.capturedState.stdout, `steps[${index}].capturedState.stdout`, findings);
      if (step.capturedState.stderr) scan(step.capturedState.stderr, `steps[${index}].capturedState.stderr`, findings);
    }
    if (step.capturedState?.kind === 'browser') {
      if (step.capturedState.url) scan(step.capturedState.url, `steps[${index}].capturedState.url`, findings);
      if (step.capturedState.pageTitle) scan(step.capturedState.pageTitle, `steps[${index}].capturedState.pageTitle`, findings);
    }
  }
  return findings;
}

function scanTerminal(manifest: TerminalCaptureManifest, findings: CaptureSecurityFinding[]): void {
  manifest.events.forEach((event, index) => scan(event.text, `events[${index}].text`, findings));
}

function scanBrowser(manifest: BrowserCaptureManifest, findings: CaptureSecurityFinding[]): void {
  scan(manifest.sourceVideo, 'sourceVideo', findings);
}
