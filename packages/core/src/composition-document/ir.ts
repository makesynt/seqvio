/**
 * Unified IR validation and compilation for Storyboard v1 and
 * CompositionDocument v2.
 */

import { compileStoryboardToTsx } from '../storyboard/compile';
import { validateStoryboard, type StoryboardIssue } from '../storyboard/validate';
import type { Storyboard } from '../storyboard/schema';
import { compileCompositionDocumentToTsx } from './compile';
import { detectIrVersion } from './detect';
import type { CompositionDocument } from './schema';
import { validateCompositionDocument } from './validate';

export type IrIssue = StoryboardIssue;

export function validateIr(input: unknown): IrIssue[] {
  const version = detectIrVersion(input);
  if (version === 'composition-v2') {
    return validateCompositionDocument(input);
  }
  if (version === 'storyboard-v1') {
    return validateStoryboard(input);
  }
  return [{
    severity: 'error',
    path: '$',
    code: 'unknown_ir_version',
    message:
      'Input is not a recognized Seqvio IR document (expected Storyboard v1 or CompositionDocument v2)',
    expected: 'Storyboard v1 or CompositionDocument v2',
    received: input,
    repairable: true,
    suggestion:
      'For v2, set version to "2.0". For v1 storyboard, omit version and include id + scenes.',
  }];
}

export function compileIr(input: unknown): { code: string } {
  const version = detectIrVersion(input);
  if (version === 'composition-v2') {
    return compileCompositionDocumentToTsx(input as CompositionDocument);
  }
  if (version === 'storyboard-v1') {
    return compileStoryboardToTsx(input as Storyboard);
  }
  throw new Error(
    'Input is not a recognized Seqvio IR document (expected Storyboard v1 or CompositionDocument v2)'
  );
}
