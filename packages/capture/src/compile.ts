/**
 * Compile a CaptureManifest into a CompositionDocument IR.
 *
 * This is a dispatcher: per-kind compilers are injected via `options.compilers`
 * because they carry kind-specific dependencies (terminal needs @xterm/headless
 * for grid snapshots; browser needs video-asset handling). Adapters implement
 * the compilers and callers inject them - capture itself depends on no adapter,
 * so there is no import cycle.
 *
 * The AI explain step runs inside each compiler: if a NarrationProvider is
 * supplied, narration is generated from each step's captured real state and
 * injected into the scene - narration follows what actually happened, not the
 * plan.
 */

import type {
  CaptureKind,
  CaptureManifest,
  CompileOptions,
  CompositionDocumentSeed,
} from './types';

export type CaptureCompiler<M extends CaptureManifest = CaptureManifest> = (
  manifest: M,
  options?: CompileOptions
) => Promise<CompositionDocumentSeed>;

export type CompilerMap = Partial<Record<CaptureKind, CaptureCompiler>>;

export interface CompileCaptureOptions extends CompileOptions {
  /** Per-kind compilers, injected by the caller (adapters provide them). */
  compilers?: CompilerMap;
}

export async function compileCaptureManifestToCompositionDocument(
  manifest: CaptureManifest,
  options?: CompileCaptureOptions
): Promise<CompositionDocumentSeed> {
  const compiler = options?.compilers?.[manifest.kind];
  if (!compiler) {
    throw new Error(
      `No compiler registered for capture kind "${manifest.kind}". ` +
        'Pass it via options.compilers (adapter packages provide per-kind compilers).'
    );
  }
  return compiler(manifest, options);
}
