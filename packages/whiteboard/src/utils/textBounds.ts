/**
 * Text bounds helpers for SVG <text> clip reveal.
 */

import { Point } from '../types';
import { hasCjk } from './textPath';

export interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function estimateTextBounds(
  text: string,
  fontSize: number,
  position: Point,
  align: 'left' | 'center' | 'right'
): TextBounds {
  const cjk = hasCjk(text);
  const width = Math.max(
    fontSize,
    text.length * fontSize * (cjk ? 1.05 : 0.52)
  );
  const height = fontSize * (cjk ? 1.2 : 1.15);
  let x = position.x;
  if (align === 'center') {
    x = position.x - width / 2;
  } else if (align === 'right') {
    x = position.x - width;
  }
  return {
    x,
    y: position.y - fontSize * 0.82,
    width,
    height,
  };
}

export function boundsFromSvgTextElement(
  element: SVGTextElement | null,
  fallback: TextBounds
): TextBounds {
  if (!element) {
    return fallback;
  }
  try {
    const b = element.getBBox();
    if (b.width > 0 && b.height > 0) {
      return {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
      };
    }
  } catch {
    // getBBox can fail before layout
  }
  return fallback;
}
