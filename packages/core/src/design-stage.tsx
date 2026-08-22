import React from 'react';
import { useComposition } from './composition';

export type DesignStageFit = 'contain' | 'cover' | 'stretch' | 'native';
export type DesignStageAlign = 'center' | 'top-left';

export interface DesignStageConfig {
  width: number;
  height: number;
  fit?: DesignStageFit;
  align?: DesignStageAlign;
}
export interface DesignStageLayout {
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  renderedWidth: number;
  renderedHeight: number;
}

export function resolveDesignStageLayout(
  outputWidth: number,
  outputHeight: number,
  config: DesignStageConfig,
): DesignStageLayout {
  if (![outputWidth, outputHeight, config.width, config.height].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error('DesignStage dimensions must be finite positive numbers.');
  }

  const fit = config.fit ?? 'contain';
  if (fit === 'native' && (outputWidth !== config.width || outputHeight !== config.height)) {
    throw new Error(
      `DesignStage native size ${config.width}x${config.height} does not match output ${outputWidth}x${outputHeight}.`,
    );
  }

  const ratioX = outputWidth / config.width;
  const ratioY = outputHeight / config.height;
  const scale = fit === 'cover' ? Math.max(ratioX, ratioY) : Math.min(ratioX, ratioY);
  const scaleX = fit === 'stretch' ? ratioX : fit === 'native' ? 1 : scale;
  const scaleY = fit === 'stretch' ? ratioY : fit === 'native' ? 1 : scale;
  const renderedWidth = config.width * scaleX;
  const renderedHeight = config.height * scaleY;
  const align = config.align ?? 'center';

  return {
    left: align === 'top-left' ? 0 : (outputWidth - renderedWidth) / 2,
    top: align === 'top-left' ? 0 : (outputHeight - renderedHeight) / 2,
    scaleX,
    scaleY,
    renderedWidth,
    renderedHeight,
  };
}

export interface DesignStageProps extends Partial<DesignStageConfig> {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function DesignStage({ children, width, height, fit, align, style }: DesignStageProps) {
  const { config } = useComposition();
  const design = config.design;
  const resolved: DesignStageConfig = {
    width: width ?? design?.width ?? config.width,
    height: height ?? design?.height ?? config.height,
    fit: fit ?? design?.fit ?? 'contain',
    align: align ?? design?.align ?? 'center',
  };
  const layout = resolveDesignStageLayout(config.width, config.height, resolved);

  return (
    <div
      data-seqvio-design-stage="true"
      data-seqvio-design-width={resolved.width}
      data-seqvio-design-height={resolved.height}
      data-seqvio-design-fit={resolved.fit}
      data-seqvio-design-align={resolved.align}
      style={{
        position: 'absolute',
        left: layout.left,
        top: layout.top,
        width: resolved.width,
        height: resolved.height,
        transform: `scale(${layout.scaleX}, ${layout.scaleY})`,
        transformOrigin: '0 0',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
