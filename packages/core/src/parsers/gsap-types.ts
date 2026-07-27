export type GsapMethod = 'set' | 'to' | 'from' | 'fromTo';

export interface GsapTween {
  id: string;
  target: string;
  method: GsapMethod;
  position: number | string;
  resolvedStart?: number;
  properties: Record<string, number | string>;
  fromProperties?: Record<string, number | string>;
  duration?: number;
  ease?: string;
  implicitPosition?: boolean;
}

export interface ParsedGsapTimeline {
  timelineVar: string;
  tweens: GsapTween[];
  totalDuration: number;
  hasDynamicContent?: boolean;
}

export interface GsapKeyframe {
  time: number;
  target: string;
  properties: Record<string, number | string>;
  ease?: string;
}

export interface GsapParseResult {
  timelines: ParsedGsapTimeline[];
  errors: string[];
  warnings: string[];
}

export interface GsapValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GsapParserOptions {
  strict?: boolean;
}
