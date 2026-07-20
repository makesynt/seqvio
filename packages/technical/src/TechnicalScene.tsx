import React, { CSSProperties } from 'react';
import { technicalFonts, technicalPalette } from './theme';
import { AnnotationLayer, AnnotationProvider, type AnnotationItem } from './AnnotationLayer';

export interface TechnicalSceneProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  background?: string;
  annotations?: AnnotationItem[];
  style?: CSSProperties;
}

export const TechnicalScene: React.FC<TechnicalSceneProps> = ({
  children,
  width = 1280,
  height = 720,
  background = technicalPalette.canvas,
  annotations = [],
  style,
}) => (
  <div
    style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background,
      color: technicalPalette.ink,
      fontFamily: technicalFonts.sans,
      ...style,
    }}
  >
    <AnnotationProvider>
      {children}
      {annotations.length > 0 ? <AnnotationLayer annotations={annotations} /> : null}
    </AnnotationProvider>
  </div>
);
