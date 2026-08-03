/**
 * Unified IR validation and compilation for Storyboard and ExplainerDocument.
 */

import { compileStoryboardToTsx } from '../storyboard/compile';
import { validateStoryboard, type StoryboardIssue } from '../storyboard/validate';
import type { Storyboard } from '../storyboard/schema';
import { compileExplainerDocumentToTsx } from './compile';
import { detectIrFormat } from './detect';
import type { ExplainerDocument } from './schema';
import { validateExplainerDocument } from './validate';

export type IrIssue = StoryboardIssue;

export function validateIr(input: unknown): IrIssue[] {
  const format = detectIrFormat(input);
  if (format === 'explainer') {
    return validateExplainerDocument(input);
  }
  if (format === 'storyboard') {
    return validateStoryboard(input);
  }
  return [{
    severity: 'error',
    path: '$',
    code: 'unknown_ir_version',
    message:
      'Input is not a recognized Seqvio IR document (expected Storyboard or ExplainerDocument)',
    expected: 'Storyboard or ExplainerDocument',
    received: input,
    repairable: true,
    suggestion:
      'For an explainer, set format to "seqvio-explainer" and schemaVersion to "1.0". For a storyboard, include id + scenes.',
  }];
}

export function compileIr(input: unknown): { code: string } {
  const format = detectIrFormat(input);
  if (format === 'explainer') {
    return compileExplainerDocumentToTsx(input as ExplainerDocument);
  }
  if (format === 'storyboard') {
    return compileStoryboardToTsx(input as Storyboard);
  }
  throw new Error(
    'Input is not a recognized Seqvio IR document (expected Storyboard or ExplainerDocument)'
  );
}
