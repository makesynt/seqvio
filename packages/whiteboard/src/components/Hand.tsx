/**
 * Hand Component – pencil tip cursor that follows active draw paths (no palm/fingers).
 */

import React, { CSSProperties, useRef } from 'react';
import { HandProps } from '../types';
import { useCurrentFrame } from '../hooks/useCurrentFrame';
import { useOptionalDrawRegistry } from '../context/DrawRegistry';
import { calculateProgress } from '../utils/animationUtils';
import { resolveStrokeHeadProgress } from '../utils/drawProgress';
import {
  getStrokeHeadOnPath,
  lerpAngleDegrees,
} from '../utils/strokePathUtils';
import { useWhiteboardTheme } from '../theme';

/** SVG viewBox; tip anchor aligns nib point to the stroke head. */
const PEN_VIEW = 56;
const PEN_TIP = { x: 28, y: 50 };

const ROTATION_SMOOTH = 0.45;
const IDLE_HOLD_FRAMES = 4;

export const Hand: React.FC<HandProps> = ({
  position = { x: 0, y: 0 },
  action = 'write', // pencil; `draw` renders the same shape
  style: _style = 'minimal',
  follow = true,
  visible = true,
  rotation = 0,
  size: sizeProp,
}) => {
  const theme = useWhiteboardTheme();
  const penSize = sizeProp ?? theme.penSize ?? 54;
  const frame = useCurrentFrame();
  const registry = useOptionalDrawRegistry();
  const penState = useRef({
    x: position.x,
    y: position.y,
    rot: rotation,
    idleFrames: IDLE_HOLD_FRAMES + 1,
    drawId: null as string | null,
  });

  if (!visible) return null;

  let penX = penState.current.x;
  let penY = penState.current.y;
  let penRot = penState.current.rot;
  let hasActiveDraw = false;

  if (follow && registry) {
    const activeDraw = registry.getActiveDrawAtFrame(frame);
    if (activeDraw) {
      const effectiveStart = registry.getEffectiveStart(
        activeDraw.id,
        activeDraw.start
      );
      const drawProgress = calculateProgress(
        frame,
        effectiveStart,
        activeDraw.duration,
        activeDraw.easing
      );
      const headProgress = resolveStrokeHeadProgress(
        drawProgress,
        activeDraw.washTailFraction
      );

      const usePathFollow = activeDraw.followPath !== false;
      let targetRot = penState.current.rot;

      if (!usePathFollow) {
        hasActiveDraw = true;
        penState.current.idleFrames = 0;
        const point = activeDraw.getPointAtProgress(headProgress);
        penX = point.x;
        penY = point.y;
        targetRot = activeDraw.getAngleAtProgress(headProgress) + 90;
      } else if (activeDraw.pathElement) {
        const pathLength = activeDraw.pathElement.getTotalLength();
        if (pathLength > 0) {
          hasActiveDraw = true;
          penState.current.idleFrames = 0;
          const head = getStrokeHeadOnPath(
            activeDraw.pathElement,
            headProgress,
            activeDraw.strokeWidth
          );
          penX = head.point.x;
          penY = head.point.y;
          targetRot = head.angleDeg + 90;
        }
      }

      if (hasActiveDraw) {
        const drawChanged = penState.current.drawId !== activeDraw.id;
        penState.current.drawId = activeDraw.id;
        if (drawChanged) {
          penRot = targetRot;
        } else {
          penRot = lerpAngleDegrees(
            penState.current.rot,
            targetRot,
            ROTATION_SMOOTH
          );
        }
      }
    }
  }

  if (hasActiveDraw) {
    penState.current.x = penX;
    penState.current.y = penY;
    penState.current.rot = penRot;
  } else if (follow) {
    penState.current.idleFrames += 1;
    if (penState.current.idleFrames > IDLE_HOLD_FRAMES) {
      return null;
    }
    penX = penState.current.x;
    penY = penState.current.y;
    penRot = penState.current.rot;
  }

  const tipOffsetX = (PEN_TIP.x / PEN_VIEW) * penSize;
  const tipOffsetY = (PEN_TIP.y / PEN_VIEW) * penSize;
  const originX = (PEN_TIP.x / PEN_VIEW) * penSize;
  const originY = (PEN_TIP.y / PEN_VIEW) * penSize;

  const penStyle: CSSProperties = {
    position: 'absolute',
    left: penX - tipOffsetX,
    top: penY - tipOffsetY,
    width: penSize,
    height: penSize,
    transform: `rotate(${penRot}deg)`,
    transformOrigin: `${originX}px ${originY}px`,
    pointerEvents: 'none',
    zIndex: 1000,
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.16))',
  };

  return (
    <div style={penStyle}>
      <PenTipSVG
        action={action}
        ink={theme.colors.ink}
        accent={theme.colors.accent}
        size={penSize}
      />
    </div>
  );
};

/** Pencil cursor — filled silhouette, readable on video. */
const PENCIL_WOOD = '#ddb97a';
const PENCIL_LEAD = '#404040';

const PenTipSVG: React.FC<{
  action: string;
  ink: string;
  accent: string;
  size: number;
}> = ({ action, ink, accent, size }) => {
  const vb = PEN_VIEW;
  const { x: tx, y: ty } = PEN_TIP;
  const sw = 1.15;

  if (action === 'point') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
        <circle cx={tx} cy={ty} r={5} fill={accent} fillOpacity={0.4} />
        <circle cx={tx} cy={ty} r={2.5} fill={ink} />
      </svg>
    );
  }

  if (action === 'erase') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
        <rect
          x={tx - 10}
          y={ty - 7}
          width={20}
          height={10}
          rx={2}
          fill="#f4f4f4"
          stroke={ink}
          strokeWidth={1.4}
        />
      </svg>
    );
  }

  // write + draw: pencil (framework default). draw kept for API compat.
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
      {/* eraser */}
      <rect
        x={tx - 5.5}
        y={7}
        width={11}
        height={7}
        rx={2}
        fill="#f0a0a8"
        stroke={ink}
        strokeWidth={sw}
      />
      {/* wooden body */}
      <path
        d={`M ${tx - 5} 14 L ${tx + 5} 14 L ${tx + 4} ${ty - 9} L ${tx - 4} ${ty - 9} Z`}
        fill={PENCIL_WOOD}
        stroke={ink}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* sharpened wood cone */}
      <path
        d={`M ${tx - 4} ${ty - 9} L ${tx + 4} ${ty - 9} L ${tx + 3} ${ty - 4} L ${tx - 3} ${ty - 4} Z`}
        fill="#c9a66a"
        stroke={ink}
        strokeWidth={sw * 0.9}
        strokeLinejoin="round"
      />
      {/* graphite */}
      <path
        d={`M ${tx} ${ty} L ${tx - 3} ${ty - 4} L ${tx + 3} ${ty - 4} Z`}
        fill={PENCIL_LEAD}
        stroke={ink}
        strokeWidth={sw * 0.9}
        strokeLinejoin="round"
      />
    </svg>
  );
};

Hand.displayName = 'Hand';

export default Hand;
