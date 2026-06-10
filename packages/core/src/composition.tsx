/**
 * Seqvio Composition Components
 */

import React, { useContext, createContext, useMemo } from 'react';
import {
  resolveCompositionAudioManifest,
  type CompositionAudioManifest,
} from './audio';
import { TimelineEngine } from './timeline';
import { runtimeGlobalName } from './brand';
import {
  buildCompositionLayout,
  CompositionLayout,
  getActiveTransitionAtFrame,
  getSceneRegistration,
  SceneRegistration,
} from './scene-registry';
import { resolveCompositionDurationFrames } from './time';
import { getTransitionProgress, getTransitionStyle } from './transitions';
import { FpsProvider, SceneLocalFrameProvider } from './frame';

export interface CompositionConfig {
  id: string;
  width: number;
  height: number;
  fps?: number;
  duration?: number;
  theme?: string;
  backgroundColor?: string;
  audio?: CompositionAudioManifest;
}

export interface SceneProps {
  id: string;
  duration?: number;
  children: React.ReactNode;
}

export interface LayerProps {
  id?: string;
  trackIndex?: number;
  start?: number;
  duration?: number;
  blendMode?: BlendMode;
  children: React.ReactNode;
}

export interface TransitionProps {
  type: TransitionType;
  duration: number;
  options?: Record<string, unknown>;
}

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn';

export type TransitionType =
  | 'fade'
  | 'slide'
  | 'wipe'
  | 'domain-warp'
  | 'light-leak'
  | 'glitch'
  | 'flash-through-white'
  | 'cinematic-zoom'
  | 'gravitational-lens';

interface CompositionContextValue {
  config: CompositionConfig;
  timeline: TimelineEngine;
  layout: CompositionLayout;
  getSceneRegistration: (sceneId: string) => SceneRegistration | undefined;
}

const CompositionContext = createContext<CompositionContextValue | null>(null);

export function useComposition(): CompositionContextValue {
  const context = useContext(CompositionContext);
  if (!context) {
    throw new Error('useComposition must be used within a VideoComposition');
  }
  return context;
}

export interface VideoCompositionProps extends CompositionConfig {
  children: React.ReactNode;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  id,
  width,
  height,
  fps = 30,
  duration,
  theme,
  backgroundColor = '#000000',
  audio,
  children,
}) => {
  const resolvedAudio = useMemo(
    () => resolveCompositionAudioManifest(audio),
    [audio]
  );
  const layout = useMemo(
    () => buildCompositionLayout(children, undefined, { audioManifest: resolvedAudio, fps }),
    [children, resolvedAudio, fps]
  );
  const effectiveDuration = resolveCompositionDurationFrames(
    resolvedAudio?.lockToAudio ? layout.totalDuration : duration ?? layout.totalDuration,
    fps,
    resolvedAudio
  );

  const [timeline] = React.useState(
    () => new TimelineEngine({ fps, duration: effectiveDuration })
  );

  if (typeof window !== 'undefined') {
    const runtimeTimeline = runtimeGlobalName('timeline') as '__seqvio_timeline';
    window[runtimeTimeline] = timeline;
    const runtimeMeta = runtimeGlobalName('compositionMeta') as '__seqvio_compositionMeta';
    (window as unknown as Record<string, unknown>)[runtimeMeta] = {
      duration: effectiveDuration,
      fps,
      audio: resolvedAudio,
    };
  }

  const config: CompositionConfig = {
    id,
    width,
    height,
    fps,
    duration: effectiveDuration,
    theme,
      backgroundColor,
      audio: resolvedAudio,
  };

  const frame = timeline.getCurrentFrame();
  const activeTransition = getActiveTransitionAtFrame(layout, frame);

  return (
    <CompositionContext.Provider
      value={{
        config,
        timeline,
        layout,
        getSceneRegistration: (sceneId) => getSceneRegistration(layout, sceneId),
      }}
    >
      <FpsProvider value={fps}>
        <div
          id={id}
          data-composition-id={id}
          style={{
            position: 'relative',
            width,
            height,
            backgroundColor,
            overflow: 'hidden',
          }}
        >
          {children}
          {activeTransition && (
            <TransitionOverlay transition={activeTransition} frame={frame} />
          )}
        </div>
      </FpsProvider>
    </CompositionContext.Provider>
  );
};

VideoComposition.displayName = 'VideoComposition';

export const Scene: React.FC<SceneProps> = ({ id, duration, children }) => {
  const { timeline, layout } = useComposition();
  const frame = timeline.getCurrentFrame();
  const registration = getSceneRegistration(layout, id);

  if (!registration) return null;

  const isActive = frame >= registration.globalStart && frame < registration.globalEnd;
  const activeTransition = getActiveTransitionAtFrame(layout, frame);
  const isOutgoing =
    activeTransition?.afterSceneId === id &&
    frame >= activeTransition.globalStart &&
    frame < activeTransition.globalEnd;
  const isIncoming =
    activeTransition?.beforeSceneId === id &&
    frame >= activeTransition.globalStart &&
    frame < activeTransition.globalEnd;

  if (!isActive && !isOutgoing && !isIncoming) {
    return null;
  }

  let sceneStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  if (activeTransition && (isOutgoing || isIncoming)) {
    const progress = getTransitionProgress(
      frame,
      activeTransition.globalStart,
      activeTransition.duration
    );
    const style = getTransitionStyle(activeTransition.type, progress);
    if (isOutgoing) {
      sceneStyle.opacity = style.outgoingOpacity;
      sceneStyle.zIndex = 1;
    }
    if (isIncoming) {
      sceneStyle.opacity = style.incomingOpacity;
      sceneStyle.transform = style.incomingTransform;
      sceneStyle.clipPath = style.overlayClipPath;
      sceneStyle.zIndex = 2;
    }
  }

  return (
    <div data-scene-id={id} style={sceneStyle}>
      <SceneLocalFrameProvider
        value={Math.max(0, frame - registration.globalStart)}
      >
        {children}
      </SceneLocalFrameProvider>
    </div>
  );
};

Scene.displayName = 'Scene';

export const Transition: React.FC<TransitionProps> = () => null;

Transition.displayName = 'Transition';

const TransitionOverlay: React.FC<{
  transition: ReturnType<typeof getActiveTransitionAtFrame> extends infer T ? NonNullable<T> : never;
  frame: number;
}> = ({ transition, frame }) => {
  const progress = getTransitionProgress(
    frame,
    transition.globalStart,
    transition.duration
  );
  const style = getTransitionStyle(transition.type, progress);

  if (transition.type === 'wipe') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.02)',
          clipPath: style.overlayClipPath,
          zIndex: 20,
        }}
      />
    );
  }

  return null;
};

export const Layer: React.FC<LayerProps> = ({
  id,
  trackIndex = 0,
  start = 0,
  duration,
  blendMode = 'normal',
  children,
}) => {
  const { timeline } = useComposition();
  const frame = timeline.getCurrentFrame();
  const isVisible = duration
    ? frame >= start && frame < start + duration
    : frame >= start;

  if (!isVisible) return null;

  return (
    <div
      data-layer-id={id}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: trackIndex,
        mixBlendMode: blendMode,
      }}
    >
      {children}
    </div>
  );
};

Layer.displayName = 'Layer';

export interface TextProps {
  variant?: 'headline' | 'body' | 'caption';
  animate?: 'fade-in' | 'typewriter' | 'slide-up';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  animate,
  children,
  style,
}) => {
  const { timeline } = useComposition();
  let animationStyle: React.CSSProperties = {};

  if (animate === 'fade-in') {
    animationStyle.opacity = timeline.interpolate([0, 1], {
      start: 0,
      duration: 30,
      easing: 'easeOut',
    });
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    headline: { fontSize: '4rem', fontWeight: 'bold', lineHeight: 1.2 },
    body: { fontSize: '1.5rem', lineHeight: 1.5 },
    caption: { fontSize: '1rem', lineHeight: 1.4 },
  };

  return (
    <div style={{ ...variantStyles[variant], ...animationStyle, ...style }}>
      {children}
    </div>
  );
};

declare global {
  interface Window {
    __seqvio_timeline?: TimelineEngine;
  }
}
