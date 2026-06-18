/**
 * Whiteboard theme context
 */

import React, { createContext, useContext, useMemo } from 'react';
import {
  WhiteboardTheme,
  TypeScale,
  Spacing,
  defaultWhiteboardTheme,
  mergeTheme,
} from './defaultTheme';

const WhiteboardThemeContext = createContext<WhiteboardTheme>(defaultWhiteboardTheme);

export interface WhiteboardThemeProviderProps {
  theme?: Partial<WhiteboardTheme>;
  children: React.ReactNode;
}

export function WhiteboardThemeProvider({
  theme: themeOverride,
  children,
}: WhiteboardThemeProviderProps) {
  const value = useMemo(() => mergeTheme(themeOverride), [themeOverride]);

  return (
    <WhiteboardThemeContext.Provider value={value}>
      {children}
    </WhiteboardThemeContext.Provider>
  );
}

export function useWhiteboardTheme(): WhiteboardTheme {
  return useContext(WhiteboardThemeContext);
}

export function useOptionalWhiteboardTheme(): WhiteboardTheme | null {
  const ctx = useContext(WhiteboardThemeContext);
  return ctx === defaultWhiteboardTheme ? null : ctx;
}

/**
 * Returns the current theme's `typeScale` object.
 *
 * Use inside a WhiteboardScene subtree to read named font-size tokens:
 *
 * ```tsx
 * const ts = useTypeScale();
 * <DrawText text="Title" fontSize={ts.h1} ... />
 * <DrawText text="Body"  fontSize={ts.body} ... />
 * ```
 */
export function useTypeScale(): TypeScale {
  return useContext(WhiteboardThemeContext).typeScale;
}

/**
 * Returns the current theme's `spacing` object.
 *
 * Use inside a WhiteboardScene subtree to read named spacing tokens:
 *
 * ```tsx
 * const sp = useSpacing();
 * <DrawText position={{ x: sp.padX, y: sp.padY }} ... />
 * <DrawShape position={{ x: sp.padX, y: sp.padY + ts.h1 + sp.gapMd }} ... />
 * ```
 */
export function useSpacing(): Spacing {
  return useContext(WhiteboardThemeContext).spacing;
}

export { defaultWhiteboardTheme, mergeTheme };
export type { WhiteboardTheme, TypeScale, Spacing };
