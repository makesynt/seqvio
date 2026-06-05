/**
 * Whiteboard theme context
 */

import React, { createContext, useContext, useMemo } from 'react';
import {
  WhiteboardTheme,
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

export { defaultWhiteboardTheme, mergeTheme };
export type { WhiteboardTheme };
