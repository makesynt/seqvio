import { MIN_SECRET_LENGTH } from './constants';
import type { TerminalNarratorPlan } from './types';

export interface RedactSecretsOptions {
  /** Extra environment object to scan for secrets (e.g. plan.shell.env). */
  env?: Record<string, string | undefined>;
  /** Minimum value length to be considered a secret. */
  minLength?: number;
  /** Additional regex patterns to apply after env-based redaction. */
  patterns?: RegExp[];
}

function secretKeyPredicate(key: string): boolean {
  const lower = key.toLowerCase();
  // Whole-ish tokens rather than loose substring matches to avoid KEYBOARD/MONKEY false positives.
  return (
    lower === 'token' ||
    lower.endsWith('_token') ||
    lower.startsWith('token_') ||
    lower === 'key' ||
    lower.endsWith('_key') ||
    lower.startsWith('api_key') ||
    lower.endsWith('_api_key') ||
    lower === 'secret' ||
    lower.endsWith('_secret') ||
    lower.startsWith('secret_') ||
    lower === 'password' ||
    lower.endsWith('_password') ||
    lower.startsWith('password_') ||
    lower === 'pwd' ||
    lower.endsWith('_pwd') ||
    lower === 'auth' ||
    lower.endsWith('_auth') ||
    lower.startsWith('auth_')
  );
}

function collectEnvCandidates(
  sources: Array<Record<string, string | undefined> | undefined>,
  minLength: number
): string[] {
  const values = new Set<string>();
  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      if (typeof value !== 'string' || value.length < minLength) continue;
      if (secretKeyPredicate(key)) {
        values.add(value);
      }
    }
  }
  return Array.from(values);
}

/**
 * Best-effort secret redaction.
 *
 * - Scans process.env and the provided env for keys that look like secrets.
 * - Replaces their values with [REDACTED].
 * - Sorts candidates by length descending before replacing to avoid partial matches.
 * - Applies optional regex patterns last.
 */
export function redactSecrets(input: string, options: RedactSecretsOptions = {}): string {
  const minLength = options.minLength ?? MIN_SECRET_LENGTH;
  const candidates = collectEnvCandidates([process.env, options.env], minLength);
  if (candidates.length === 0 && (!options.patterns || options.patterns.length === 0)) {
    return input;
  }

  let out = input;
  // Replace longest values first so a short secret cannot damage a longer one.
  for (const value of candidates.sort((a, b) => b.length - a.length)) {
    out = out.split(value).join('[REDACTED]');
  }

  if (options.patterns) {
    for (const pattern of options.patterns) {
      out = out.replace(pattern, '[REDACTED]');
    }
  }

  return out;
}

/**
 * Return a shareable plan copy with secrets removed from every string field.
 * The original plan remains available in memory for process execution.
 */
export function redactPlanForArtifacts(plan: TerminalNarratorPlan): TerminalNarratorPlan {
  const options: RedactSecretsOptions = {
    env: plan.shell.env,
    patterns: plan.redactPatterns?.map((pattern) => new RegExp(pattern, 'g')),
  };

  return JSON.parse(
    JSON.stringify(plan, (_key, value) =>
      typeof value === 'string' ? redactSecrets(value, options) : value
    )
  ) as TerminalNarratorPlan;
}
