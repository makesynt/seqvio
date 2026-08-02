import * as fs from 'node:fs';
import * as path from 'node:path';
import { isPacingProfileId } from '@seqvio/core';
import type { QaDiagnostic } from './qa-diagnostics';

export const QA_CONFIG_VERSION = '1.0' as const;

export interface QaSuppression {
  code: string;
  path: string;
  reason: string;
}

export interface QaConfig {
  version: typeof QA_CONFIG_VERSION;
  pacingProfile?: string;
  suppressions?: QaSuppression[];
}

export interface SuppressedQaDiagnostic extends QaDiagnostic {
  suppression: QaSuppression;
}

function invalid(message: string): never {
  throw new Error(`Invalid QA config: ${message}`);
}

export function parseQaConfig(input: unknown): QaConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('expected an object');
  const value = input as Record<string, unknown>;
  if (value.version !== QA_CONFIG_VERSION) invalid(`version must be "${QA_CONFIG_VERSION}"`);
  if (value.pacingProfile !== undefined && !isPacingProfileId(value.pacingProfile)) {
    invalid(`unsupported pacingProfile "${String(value.pacingProfile)}"`);
  }
  if (value.suppressions !== undefined && !Array.isArray(value.suppressions)) {
    invalid('suppressions must be an array');
  }
  const suppressions = (value.suppressions ?? []).map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) invalid(`suppressions[${index}] must be an object`);
    const item = entry as Record<string, unknown>;
    if (typeof item.code !== 'string' || !item.code.trim()) invalid(`suppressions[${index}].code is required`);
    if (typeof item.path !== 'string' || !item.path.trim()) invalid(`suppressions[${index}].path is required`);
    if (typeof item.reason !== 'string' || item.reason.trim().length < 8) invalid(`suppressions[${index}].reason must contain at least 8 characters`);
    return { code: item.code.trim(), path: item.path.trim(), reason: item.reason.trim() };
  });
  return {
    version: QA_CONFIG_VERSION,
    pacingProfile: value.pacingProfile as string | undefined,
    suppressions,
  };
}

export function loadQaConfig(filePath: string): QaConfig {
  const resolved = path.resolve(filePath);
  return parseQaConfig(JSON.parse(fs.readFileSync(resolved, 'utf8')));
}

export function applyQaSuppressions(
  issues: QaDiagnostic[],
  suppressions: QaSuppression[],
): { active: QaDiagnostic[]; suppressed: SuppressedQaDiagnostic[]; unused: QaSuppression[] } {
  const used = new Set<number>();
  const active: QaDiagnostic[] = [];
  const suppressed: SuppressedQaDiagnostic[] = [];
  for (const issue of issues) {
    const index = issue.severity === 'warning'
      ? suppressions.findIndex((item) => item.code === issue.code && item.path === (issue.path ?? '$'))
      : -1;
    if (index < 0) {
      active.push(issue);
      continue;
    }
    used.add(index);
    suppressed.push({ ...issue, suppression: suppressions[index] });
  }
  const unused = suppressions.filter((_, index) => !used.has(index));
  active.push(...unused.map((item) => ({
    severity: 'warning' as const,
    code: 'unused_qa_suppression',
    path: item.path,
    message: `Suppression for "${item.code}" did not match an active warning.`,
    repair: 'Remove the stale suppression or update its exact diagnostic path.',
  })));
  return { active, suppressed, unused };
}
