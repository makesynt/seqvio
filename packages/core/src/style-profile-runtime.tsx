import React, { createContext, useContext } from 'react';
import type { StyleProfile } from './style-profile';

const StyleProfileContext = createContext<StyleProfile | undefined>(undefined);

export function useStyleProfile(): StyleProfile | undefined {
  return useContext(StyleProfileContext);
}

export function StyleProfileProvider({ profile, children }: { profile?: StyleProfile; children: React.ReactNode }) {
  if (!profile) return <>{children}</>;
  const variables = {
    '--seqvio-color-background': profile.paletteRoles.background,
    '--seqvio-color-ink': profile.paletteRoles.ink,
    '--seqvio-color-accent': profile.paletteRoles.accent,
    '--seqvio-color-muted': profile.paletteRoles.muted,
    '--seqvio-font-heading': profile.typography.headingFamily,
    '--seqvio-font-body': profile.typography.bodyFamily,
    '--seqvio-font-mono': profile.typography.monoFamily ?? 'monospace',
  } as React.CSSProperties;
  return <StyleProfileContext.Provider value={profile}><div data-seqvio-style-profile={profile.id} style={{ display: 'contents', ...variables }}>{children}</div></StyleProfileContext.Provider>;
}
