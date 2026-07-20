/**
 * IR version detection — v1 Storyboard vs CompositionDocument v2.
 */

import type { CompositionDocument } from './schema';
import { COMPOSITION_DOCUMENT_VERSION } from './schema';

export type IrVersion = 'storyboard-v1' | 'composition-v2';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isCompositionDocumentV2(
  input: unknown
): input is CompositionDocument {
  return (
    isObject(input) &&
    input.version === COMPOSITION_DOCUMENT_VERSION &&
    typeof input.id === 'string' &&
    Array.isArray(input.scenes)
  );
}

export function detectIrVersion(input: unknown): IrVersion | null {
  if (!isObject(input)) return null;
  if (input.version === COMPOSITION_DOCUMENT_VERSION) return 'composition-v2';
  if (typeof input.id === 'string' && Array.isArray(input.scenes)) {
    return 'storyboard-v1';
  }
  return null;
}
