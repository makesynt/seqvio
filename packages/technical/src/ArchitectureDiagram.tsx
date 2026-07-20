import React, { useMemo } from 'react';
import { useCurrentFrame } from '@seqvio/core';
import { AnnotationTarget } from './AnnotationLayer';
import {
  diagramVisibility,
  layoutDiagram,
  type DiagramEdgeInput,
  type DiagramNodeInput,
  type DiagramStep,
} from './diagram-layout';
import { ease } from './anim';
import { technicalFonts, technicalPalette } from './theme';

export interface ArchitectureDiagramProps {
  id: string;
  nodes: DiagramNodeInput[];
  edges: DiagramEdgeInput[];
  steps?: DiagramStep[];
  width?: number;
  height?: number;
  title?: string;
}

function polyline(points: Array<{ x: number; y: number }>): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  id,
  nodes,
  edges,
  steps = [],
  width = 1280,
  height = 720,
  title = 'Architecture',
}) => {
  const frame = useCurrentFrame();
  const layout = useMemo(
    () => layoutDiagram(nodes, edges, width, height),
    [nodes, edges, width, height]
  );
  const visibility = diagramVisibility(steps, frame);
  const revealAt = useMemo(() => {
    const map = new Map<string, number>();
    for (const step of steps) {
      if (step.action === 'reveal') map.set(step.targetId, step.at);
    }
    return map;
  }, [steps]);

  return (
    <AnnotationTarget id={id} style={{ width, height, position: 'relative' }}>
      <div
        style={{
          width,
          height,
          background: `radial-gradient(circle at top, #1e293b 0%, ${technicalPalette.canvas} 55%)`,
          color: technicalPalette.ink,
          fontFamily: technicalFonts.sans,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 32,
            top: 24,
            fontSize: 28,
            fontWeight: 700,
            zIndex: 2,
          }}
        >
          {title}
        </div>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {layout.edges.map((edge) => {
            if (!visibility.activeEdges.has(edge.id) || edge.points.length < 2) return null;
            const traceStep = steps.find(
              (step) =>
                (step.action === 'trace' || step.action === 'connect') &&
                step.edgeId === edge.id
            );
            const traceStart = traceStep?.at ?? 0;
            const traceProgress = Math.max(0, Math.min(1, (frame - traceStart) / 36));
            const visibleCount = Math.max(2, Math.floor(edge.points.length * traceProgress));
            const points = edge.points.slice(0, visibleCount);
            return (
              <g key={edge.id}>
                <path
                  d={polyline(points)}
                  fill="none"
                  stroke={technicalPalette.accent}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                {edge.label ? (
                  <text
                    x={(edge.points[1]?.x ?? 0) + 8}
                    y={(edge.points[1]?.y ?? 0) - 8}
                    fill={technicalPalette.muted}
                    fontSize={14}
                    fontFamily={technicalFonts.sans}
                  >
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        {layout.nodes.map((node) => {
          const revealed = visibility.revealedNodes.has(node.id);
          const start = revealAt.get(node.id) ?? 0;
          const progress = revealed ? ease((frame - start) / 20) : 0;
          const emphasized = visibility.emphasized.has(node.id);
          if (!revealed) return null;
          return (
            <AnnotationTarget
              key={node.id}
              id={node.id}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
                transform: `scale(${0.9 + progress * 0.1})`,
                transformOrigin: 'center center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 14,
                  border: emphasized
                    ? `2px solid ${technicalPalette.warning}`
                    : `1px solid ${technicalPalette.line}`,
                  background: emphasized
                    ? 'rgba(251, 191, 36, 0.12)'
                    : technicalPalette.panel,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '0 12px',
                  boxShadow: emphasized
                    ? '0 0 24px rgba(251, 191, 36, 0.25)'
                    : '0 12px 30px rgba(15, 23, 42, 0.35)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: technicalPalette.ink,
                  boxSizing: 'border-box',
                }}
              >
                {node.label}
              </div>
            </AnnotationTarget>
          );
        })}
      </div>
    </AnnotationTarget>
  );
};
