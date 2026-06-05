declare module 'opentype.js' {
  export interface Font {
    getPath(text: string, x: number, y: number, fontSize: number): {
      toPathData(decimalPlaces?: number): string;
      getBoundingBox(): { x1: number; y1: number; x2: number; y2: number };
    };
  }

  export function parse(buffer: ArrayBuffer): Font;
  export function loadSync(path: string): Font;
}
