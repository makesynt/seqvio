/**
 * WhiteboardScene Component
 */

import React, { CSSProperties } from 'react';
import { WhiteboardConfig } from '../types';
import { DrawRegistryProvider } from '../context/DrawRegistry';
import {
  WhiteboardThemeProvider,
  mergeTheme,
  WhiteboardTheme,
} from '../theme';
import { SceneFontFaces } from '../theme/SceneFontFaces';

interface WhiteboardSceneProps extends WhiteboardConfig {
  children: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  theme?: Partial<WhiteboardTheme>;
  /**
   * When true (default), only one drawable animates at a time — matches a single pen tip.
   * Set false to allow overlapping authored start times.
   */
  singlePen?: boolean;
}

const backgroundTextures: Record<string, string> = {
  paper: '#f8f9fb',
  whiteboard: 'linear-gradient(180deg, #fefefe 0%, #f8f8f8 100%)',
  chalkboard: 'linear-gradient(180deg, #2d3e2f 0%, #1a2520 100%)',
  none: 'transparent',
};

const paperLineOverlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage:
    'repeating-linear-gradient(0deg, rgba(240,240,240,0.55) 0px, rgba(240,240,240,0.55) 1px, transparent 1px, transparent 3px)',
  opacity: 0.5,
};

export const WhiteboardScene: React.FC<WhiteboardSceneProps> = ({
  children,
  width = 1920,
  height = 1080,
  background,
  texture = 'paper',
  strokeColor,
  className,
  style,
  theme: themeOverride,
  singlePen = true,
}) => {
  const mergedTheme = mergeTheme(themeOverride);
  const resolvedBackground =
    background ??
    (texture === 'paper' ? mergedTheme.colors.background : undefined) ??
    '#ffffff';
  const resolvedStroke = strokeColor ?? mergedTheme.colors.ink;

  const containerStyle: CSSProperties = {
    position: 'relative',
    width,
    height,
    background: backgroundTextures[texture] || resolvedBackground,
    overflow: 'hidden',
    fontFamily: mergedTheme.fontFamily,
    ...style,
  };

  const sceneTheme: Partial<WhiteboardTheme> = {
    ...mergedTheme,
    colors: {
      ...mergedTheme.colors,
      ink: resolvedStroke,
    },
  };

  return (
    <WhiteboardThemeProvider theme={sceneTheme}>
      <DrawRegistryProvider singlePen={singlePen}>
        <div
          className={`whiteboard-scene ${className || ''}`}
          style={containerStyle}
        >
          <SceneFontFaces theme={mergedTheme} />
          {texture === 'paper' && <div aria-hidden style={paperLineOverlay} />}
          {children}
        </div>
      </DrawRegistryProvider>
    </WhiteboardThemeProvider>
  );
};

export default WhiteboardScene;
