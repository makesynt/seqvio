import React, { useMemo } from 'react';
import { AnnotationTarget, AttentionSequenceLayer, useCurrentFrame, type AttentionSequenceItem } from '@seqvio/core';
import { ease } from './anim';
import { technicalFonts, technicalPalette } from './theme';

export interface InfographicMetric {
  id: string;
  label: string;
  value: string;
  detail?: string;
  color?: string;
  at?: number;
}

export interface InfographicComparison {
  id: string;
  label: string;
  before: number;
  after: number;
  beforeLabel?: string;
  afterLabel?: string;
  at?: number;
}

export interface InfographicProcessStep {
  id: string;
  label: string;
  detail?: string;
  at?: number;
}

export interface InfographicTimelineEvent {
  id: string;
  label: string;
  detail?: string;
  at?: number;
}

export interface InfographicRelationshipNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface InfographicRelationship {
  id: string;
  from: string;
  to: string;
  label?: string;
  at?: number;
}

export interface InfographicChartPoint { x: string; y: number; }
export interface InfographicChartSeries { id: string; label: string; color?: string; points: InfographicChartPoint[]; }
export interface InfographicChartAxis { label?: string; min?: number; max?: number; ticks?: number; }
export interface InfographicChart {
  id: string;
  title: string;
  kind: 'bar' | 'line';
  series: InfographicChartSeries[];
  xAxis?: InfographicChartAxis;
  yAxis?: InfographicChartAxis;
  legend?: 'none' | 'top' | 'bottom';
  unit?: string;
  sourceLabel?: string;
  at?: number;
}

export interface InfographicSceneProps {
  id: string;
  title?: string;
  width?: number;
  height?: number;
  metrics?: InfographicMetric[];
  comparisons?: InfographicComparison[];
  process?: InfographicProcessStep[];
  timeline?: InfographicTimelineEvent[];
  relationshipNodes?: InfographicRelationshipNode[];
  relationships?: InfographicRelationship[];
  charts?: InfographicChart[];
  attention?: AttentionSequenceItem[];
}

export function infographicProgress(frame: number, at = 0, duration = 18): number {
  return ease((frame - at) / Math.max(1, duration));
}

function revealStyle(frame: number, at: number | undefined, index: number): React.CSSProperties {
  const progress = infographicProgress(frame, at ?? index * 10);
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * 10}px)`,
  };
}

const ItemTarget: React.FC<{
  id: string;
  frame: number;
  at?: number;
  index: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ id, frame, at, index, children, style }) => (
  <AnnotationTarget id={id} style={{ ...style, ...revealStyle(frame, at, index) }}>
    {children}
  </AnnotationTarget>
);

export function resolveChartDomain(chart: InfographicChart): { min: number; max: number } {
  const values = chart.series.flatMap((series) => series.points.map((point) => point.y));
  const observedMin = values.length ? Math.min(...values) : 0;
  const observedMax = values.length ? Math.max(...values) : 1;
  const min = chart.yAxis?.min ?? Math.min(0, observedMin);
  const requestedMax = chart.yAxis?.max ?? observedMax;
  return { min, max: requestedMax > min ? requestedMax : min + 1 };
}

const CHART_COLORS = ['#4f8cff', '#21a179', '#f0a43c', '#d7658b'];

const ChartView: React.FC<{ chart: InfographicChart; frame: number; index: number }> = ({ chart, frame, index }) => {
  const progress = infographicProgress(frame, chart.at ?? index * 12, 24);
  const domain = resolveChartDomain(chart);
  const categories = [...new Set(chart.series.flatMap((series) => series.points.map((point) => point.x)))];
  const plot = { left: 58, top: 32, width: 424, height: 224 };
  const scaleY = (value: number) => plot.top + plot.height - ((value - domain.min) / (domain.max - domain.min)) * plot.height;
  const ticks = Math.max(2, chart.yAxis?.ticks ?? 4);
  const legend = chart.legend ?? 'top';
  return (
    <ItemTarget id={chart.id} frame={frame} at={chart.at} index={index} style={{ padding: 18, background: technicalPalette.panel, border: `1px solid ${technicalPalette.line}`, borderRadius: 8, minHeight: 448, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{chart.title}</div>
        {chart.unit ? <div style={{ color: technicalPalette.muted, fontSize: 12 }}>Unit: {chart.unit}</div> : null}
      </div>
      {legend === 'top' ? <ChartLegend chart={chart} /> : null}
      <svg viewBox="0 0 520 310" width="100%" height="310" aria-label={chart.title}>
        {Array.from({ length: ticks + 1 }, (_, tick) => {
          const ratio = tick / ticks;
          const y = plot.top + plot.height * ratio;
          const value = domain.max - (domain.max - domain.min) * ratio;
          return <g key={tick}><line x1={plot.left} y1={y} x2={plot.left + plot.width} y2={y} stroke={technicalPalette.line} strokeWidth="1" /><text x={plot.left - 10} y={y + 4} textAnchor="end" fill={technicalPalette.muted} fontSize="11">{Number(value.toFixed(1))}</text></g>;
        })}
        <line x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.top + plot.height} stroke={technicalPalette.muted} />
        <line x1={plot.left} y1={plot.top + plot.height} x2={plot.left + plot.width} y2={plot.top + plot.height} stroke={technicalPalette.muted} />
        {categories.map((category, categoryIndex) => {
          const x = plot.left + ((categoryIndex + 0.5) / Math.max(1, categories.length)) * plot.width;
          return <text key={category} x={x} y={plot.top + plot.height + 20} textAnchor="middle" fill={technicalPalette.muted} fontSize="11">{category}</text>;
        })}
        {chart.kind === 'bar' ? chart.series.map((series, seriesIndex) => {
          const color = series.color ?? CHART_COLORS[seriesIndex % CHART_COLORS.length];
          const categoryWidth = plot.width / Math.max(1, categories.length);
          const barWidth = Math.min(34, categoryWidth * 0.72 / Math.max(1, chart.series.length));
          return <AnnotationTarget key={series.id} id={series.id} as="g">{series.points.map((point) => {
            const categoryIndex = categories.indexOf(point.x);
            const center = plot.left + (categoryIndex + 0.5) * categoryWidth;
            const x = center - (chart.series.length * barWidth) / 2 + seriesIndex * barWidth;
            const top = scaleY(domain.min + (point.y - domain.min) * progress);
            return <rect key={point.x} x={x + 1} y={top} width={Math.max(2, barWidth - 2)} height={plot.top + plot.height - top} rx="2" fill={color} />;
          })}</AnnotationTarget>;
        }) : chart.series.map((series, seriesIndex) => {
          const color = series.color ?? CHART_COLORS[seriesIndex % CHART_COLORS.length];
          const path = series.points.map((point, pointIndex) => {
            const categoryIndex = categories.indexOf(point.x);
            const x = plot.left + ((categoryIndex + 0.5) / Math.max(1, categories.length)) * plot.width;
            const y = scaleY(point.y);
            return `${pointIndex === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');
          return <AnnotationTarget key={series.id} id={series.id} as="g" style={{ opacity: progress }}><path d={path} fill="none" stroke={color} strokeWidth="3" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />{series.points.map((point) => { const categoryIndex = categories.indexOf(point.x); const x = plot.left + ((categoryIndex + 0.5) / Math.max(1, categories.length)) * plot.width; return <circle key={point.x} cx={x} cy={scaleY(point.y)} r="4" fill={technicalPalette.panel} stroke={color} strokeWidth="2" />; })}</AnnotationTarget>;
        })}
        {chart.xAxis?.label ? <text x={plot.left + plot.width / 2} y="304" textAnchor="middle" fill={technicalPalette.muted} fontSize="12">{chart.xAxis.label}</text> : null}
        {chart.yAxis?.label ? <text x="13" y={plot.top + plot.height / 2} textAnchor="middle" fill={technicalPalette.muted} fontSize="12" transform={`rotate(-90 13 ${plot.top + plot.height / 2})`}>{chart.yAxis.label}</text> : null}
      </svg>
      {legend === 'bottom' ? <ChartLegend chart={chart} /> : null}
      {chart.sourceLabel ? <div style={{ color: technicalPalette.muted, fontSize: 11, marginTop: 6 }}>Source: {chart.sourceLabel}</div> : null}
    </ItemTarget>
  );
};

const ChartLegend: React.FC<{ chart: InfographicChart }> = ({ chart }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12, minHeight: 18 }}>
    {chart.series.map((series, index) => <div key={series.id} style={{ display: 'flex', alignItems: 'center', gap: 6, color: technicalPalette.muted, fontSize: 12 }}><span style={{ width: 12, height: 3, background: series.color ?? CHART_COLORS[index % CHART_COLORS.length] }} />{series.label}</div>)}
  </div>
);

export const InfographicScene: React.FC<InfographicSceneProps> = ({
  id,
  title = 'Explanation',
  width = 1280,
  height = 720,
  metrics = [],
  comparisons = [],
  process = [],
  timeline = [],
  relationshipNodes = [],
  relationships = [],
  charts = [],
  attention = [],
}) => {
  const frame = useCurrentFrame();
  const nodeMap = useMemo(() => new Map(relationshipNodes.map((node) => [node.id, node])), [relationshipNodes]);

  return (
    <AnnotationTarget id={id} style={{ position: 'relative', width, height }}>
      <div style={{ position: 'relative', width, height, overflow: 'hidden', background: technicalPalette.canvas, color: technicalPalette.ink, fontFamily: technicalFonts.sans, padding: 40, boxSizing: 'border-box' }}>
        <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 28 }}>{title}</div>
        {charts.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: charts.length > 1 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)', gap: 20 }}>{charts.map((chart, index) => <ChartView key={chart.id} chart={chart} frame={frame} index={index} />)}</div> : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {metrics.map((metric, index) => (
            <ItemTarget key={metric.id} id={metric.id} frame={frame} at={metric.at} index={index} style={{ background: technicalPalette.panel, border: `1px solid ${technicalPalette.line}`, borderRadius: 10, padding: 20, minHeight: 112, boxSizing: 'border-box' }}>
              <div style={{ color: metric.color ?? technicalPalette.accent, fontSize: 34, fontWeight: 750 }}>{metric.value}</div>
              <div style={{ marginTop: 8, fontWeight: 650 }}>{metric.label}</div>
              {metric.detail ? <div style={{ marginTop: 5, color: technicalPalette.muted, fontSize: 14 }}>{metric.detail}</div> : null}
            </ItemTarget>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 30 }}>
          {comparisons.map((comparison, index) => {
            const progress = infographicProgress(frame, comparison.at ?? index * 10);
            const max = Math.max(comparison.before, comparison.after, 1);
            return (
              <ItemTarget key={comparison.id} id={comparison.id} frame={frame} at={comparison.at} index={index} style={{ minHeight: 138 }}>
                <div style={{ fontWeight: 650, marginBottom: 12 }}>{comparison.label}</div>
                {[['before', comparison.before, comparison.beforeLabel ?? 'Before', technicalPalette.muted], ['after', comparison.after, comparison.afterLabel ?? 'After', technicalPalette.success]].map(([key, value, label, color]) => (
                  <div key={key as string} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <div style={{ width: 64, color: technicalPalette.muted, fontSize: 13 }}>{label as string}</div>
                    <div style={{ flex: 1, height: 14, background: technicalPalette.surface, borderRadius: 7, overflow: 'hidden' }}>
                      <div style={{ width: `${((value as number) / max) * progress * 100}%`, height: '100%', background: color as string, borderRadius: 7 }} />
                    </div>
                    <div style={{ width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value as number}</div>
                  </div>
                ))}
              </ItemTarget>
            );
          })}
        </div>
        {process.length > 0 ? <div style={{ display: 'flex', gap: 10, marginTop: 30 }}>{process.map((step, index) => <ItemTarget key={step.id} id={step.id} frame={frame} at={step.at} index={index} style={{ flex: 1, minWidth: 0, padding: 14, borderLeft: `3px solid ${technicalPalette.accent}`, background: technicalPalette.surface }}><div style={{ fontWeight: 650 }}>{step.label}</div>{step.detail ? <div style={{ marginTop: 5, color: technicalPalette.muted, fontSize: 13 }}>{step.detail}</div> : null}</ItemTarget>)}</div> : null}
        {timeline.length > 0 ? <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginTop: 30 }}>{timeline.map((event, index) => <ItemTarget key={event.id} id={event.id} frame={frame} at={event.at} index={index} style={{ flex: 1, position: 'relative', paddingTop: 18, borderTop: `2px solid ${technicalPalette.line}` }}><div style={{ position: 'absolute', top: -7, left: 0, width: 12, height: 12, borderRadius: '50%', background: technicalPalette.warning }} /><div style={{ fontWeight: 650 }}>{event.label}</div>{event.detail ? <div style={{ color: technicalPalette.muted, fontSize: 13, marginTop: 5 }}>{event.detail}</div> : null}</ItemTarget>)}</div> : null}
        {relationshipNodes.length > 0 ? <svg width={width - 80} height={height - 80} style={{ position: 'absolute', inset: 40, pointerEvents: 'none' }}>{relationships.map((relationship, index) => { const from = nodeMap.get(relationship.from); const to = nodeMap.get(relationship.to); if (!from || !to) return null; const progress = infographicProgress(frame, relationship.at ?? index * 10); return <g key={relationship.id} opacity={progress}><line x1={from.x} y1={from.y} x2={from.x + (to.x - from.x) * progress} y2={from.y + (to.y - from.y) * progress} stroke={technicalPalette.accent} strokeWidth={2} /><text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6} fill={technicalPalette.muted} fontSize={13}>{relationship.label ?? ''}</text></g>; })}</svg> : null}
        {relationshipNodes.map((node, index) => <ItemTarget key={node.id} id={node.id} frame={frame} index={index} style={{ position: 'absolute', left: 40 + node.x - 56, top: 40 + node.y - 22, width: 112, padding: '11px 8px', textAlign: 'center', background: technicalPalette.panel, border: `1px solid ${technicalPalette.line}`, borderRadius: 8, boxSizing: 'border-box', fontSize: 14 }}>{node.label}</ItemTarget>)}
        {attention.length > 0 ? <AttentionSequenceLayer sequence={attention} sceneId={id} /> : null}
      </div>
    </AnnotationTarget>
  );
};
