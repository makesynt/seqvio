export const SEQVIO_BRAND = {
  name: 'Seqvio',
  slug: 'seqvio',
  scope: '@seqvio',
  cli: 'seqvio',
  rendererCli: 'seqvio-render',
  runtimePrefix: '__seqvio',
  description: 'A simple framework for generative video workflows',
} as const;

export type SeqvioRuntimeKey =
  | 'ready'
  | 'frameReady'
  | 'setFrame'
  | 'getMeta'
  | 'timeline'
  | 'resolvedAudioManifest'
  | 'compositionMeta';

export function runtimeGlobalName(key: SeqvioRuntimeKey): string {
  return `${SEQVIO_BRAND.runtimePrefix}_${key}`;
}
