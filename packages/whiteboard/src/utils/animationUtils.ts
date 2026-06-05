/**
 * Animation Utilities
 * Easing functions and animation helpers
 */

export type EasingFunction = (t: number) => number;

/**
 * Easing functions
 */
export const easings: Record<string, EasingFunction> = {
  linear: (t: number) => t,

  easeIn: (t: number) => t * t,

  'ease-in': (t: number) => t * t,

  easeOut: (t: number) => t * (2 - t),

  'ease-out': (t: number) => t * (2 - t),

  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t: number) => t * t * t,

  easeOutCubic: (t: number) => --t * t * t + 1,

  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInQuart: (t: number) => t * t * t * t,

  easeOutQuart: (t: number) => 1 - --t * t * t * t,

  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,

  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
};

/**
 * Calculate progress with easing
 */
export function calculateProgress(
  currentFrame: number,
  startFrame: number,
  duration: number,
  easing: string = 'linear'
): number {
  if (currentFrame < startFrame) return 0;
  if (currentFrame >= startFrame + duration) return 1;

  const t = (currentFrame - startFrame) / duration;
  const easingFn = easings[easing] || easings.linear;

  return easingFn(t);
}

/**
 * Interpolate between two values
 */
export function interpolate(
  progress: number,
  from: number,
  to: number
): number {
  return from + (to - from) * progress;
}

/**
 * Calculate draw progress for SVG stroke
 */
export function calculateStrokeDashoffset(
  progress: number,
  pathLength: number
): number {
  return pathLength * (1 - progress);
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Spring animation
 */
export function spring(
  progress: number,
  config: { stiffness?: number; damping?: number } = {}
): number {
  const { stiffness = 100, damping = 10 } = config;

  const mass = 1;
  const velocity = 0;

  const t = progress;
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const omega = Math.sqrt(stiffness / mass);

  if (zeta < 1) {
    // Under-damped
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    const A = 1;
    const B = (zeta * omega * A + velocity) / omegaD;

    return (
      1 -
      Math.exp(-zeta * omega * t) *
        (A * Math.cos(omegaD * t) + B * Math.sin(omegaD * t))
    );
  } else if (zeta === 1) {
    // Critically damped
    return 1 - Math.exp(-omega * t) * (1 + omega * t);
  } else {
    // Over-damped
    const r1 = -omega * (zeta + Math.sqrt(zeta * zeta - 1));
    const r2 = -omega * (zeta - Math.sqrt(zeta * zeta - 1));
    const A = 1;
    const B = velocity - r1 * A;

    return 1 - (A * Math.exp(r1 * t) + (B / (r2 - r1)) * Math.exp(r2 * t));
  }
}
