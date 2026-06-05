/**
 * DrawImage Component
 *
 * Display images with animated appearance. Supports fade-in, scale, and outline effects.
 *
 * @example
 * ```tsx
 * // Simple image with fade-in
 * <DrawImage
 *   src="/diagram.png"
 *   position={{ x: 500, y: 400 }}
 *   size={{ width: 400, height: 300 }}
 *   start={120}
 *   duration={90}
 * />
 *
 * // Image with outline trace effect
 * <DrawImage
 *   src="/logo.png"
 *   position={{ x: 960, y: 540 }}
 *   size={{ width: 300, height: 300 }}
 *   start={0}
 *   duration={120}
 *   traceMode="outline"
 * />
 *
 * // Custom sized image
 * <DrawImage
 *   src="/chart.svg"
 *   position={{ x: 200, y: 300 }}
 *   size={{ width: 600, height: 400 }}
 *   start={180}
 *   duration={90}
 * />
 * ```
 *
 * @param src - Image source URL (relative or absolute)
 * @param position - { x, y } position for top-left corner (default: { x: 100, y: 100 })
 * @param size - { width, height } size in pixels (default: { width: 200, height: 200 })
 * @param start - Start frame for animation (default: 0)
 * @param duration - Duration in frames
 * @param easing - Easing function (default: 'ease-out')
 * @param traceMode - Trace mode: 'outline' | 'full' | 'edges' (default: 'outline')
 */

import React, { useState, useEffect } from 'react';
import { DrawImageProps } from '../types';
import { useCurrentFrame } from '../hooks/useCurrentFrame';
import { calculateProgress } from '../utils/animationUtils';

export const DrawImage: React.FC<DrawImageProps> = ({
  src,
  position = { x: 100, y: 100 },
  size = { width: 200, height: 200 },
  start = 0,
  duration,
  easing = 'ease-out',
  traceMode = 'outline'
}) => {
  const frame = useCurrentFrame();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate animation progress
  const progress = calculateProgress(frame, start, duration, easing);

  // For MVP, we'll use a simple fade-in with scale effect
  // In production, you'd trace the image outline or edges

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    opacity: progress,
    transform: `scale(${0.8 + progress * 0.2})`,
    transition: 'none'
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: traceMode === 'outline' ? `
      drop-shadow(0 0 1px rgba(44, 62, 80, ${progress}))
      drop-shadow(0 0 2px rgba(44, 62, 80, ${progress * 0.5}))
    ` : 'none'
  };

  return (
    <div style={containerStyle}>
      <img
        src={src}
        style={imageStyle}
        onLoad={() => setImageLoaded(true)}
        alt="Whiteboard drawing"
      />
      {traceMode === 'outline' && progress < 1 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '3px solid #2c3e50',
            borderRadius: '4px',
            opacity: 1 - progress,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};

export default DrawImage;
