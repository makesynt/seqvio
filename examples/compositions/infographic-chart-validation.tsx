import React from 'react';
import { VideoComposition, type RenderableMeta } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const DURATION = 210;

export default function InfographicChartValidation() {
  return (
    <VideoComposition id="infographic-chart-validation" width={WIDTH} height={HEIGHT} fps={FPS} duration={DURATION} backgroundColor="#f5f7fa">
      <TechnicalScene width={WIDTH} height={HEIGHT} background="#f5f7fa">
        <InfographicScene
          id="chart-scene"
          title="Evidence becomes an explanation"
          width={WIDTH}
          height={HEIGHT}
          charts={[
            {
              id: 'latency-trend', title: 'Response latency', kind: 'line', unit: 'ms', legend: 'top', at: 6,
              xAxis: { label: 'Verified run' }, yAxis: { label: 'p95 latency', min: 0, max: 240, ticks: 4 },
              sourceLabel: 'Local benchmark fixture, five controlled runs',
              series: [
                { id: 'baseline-series', label: 'Baseline', color: '#8b98a5', points: [{ x: '01', y: 218 }, { x: '02', y: 205 }, { x: '03', y: 212 }, { x: '04', y: 198 }, { x: '05', y: 202 }] },
                { id: 'guided-series', label: 'Guided', color: '#4f8cff', points: [{ x: '01', y: 164 }, { x: '02', y: 132 }, { x: '03', y: 104 }, { x: '04', y: 82 }, { x: '05', y: 74 }] },
              ],
            },
            {
              id: 'review-bars', title: 'Review effort by stage', kind: 'bar', unit: 'minutes', legend: 'bottom', at: 42,
              xAxis: { label: 'Production stage' }, yAxis: { label: 'Review time', min: 0, max: 24, ticks: 4 },
              sourceLabel: 'Retained production receipts',
              series: [
                { id: 'manual-series', label: 'Manual', color: '#d7658b', points: [{ x: 'Plan', y: 18 }, { x: 'Visual', y: 22 }, { x: 'QA', y: 16 }] },
                { id: 'contract-series', label: 'Contract', color: '#21a179', points: [{ x: 'Plan', y: 10 }, { x: 'Visual', y: 12 }, { x: 'QA', y: 7 }] },
              ],
            },
          ]}
          attention={[
            { id: 'focus-trend', targetId: 'guided-series', kind: 'spotlight', start: 84, duration: 48, label: 'trend', handoffTo: 'review-bars', minHoldFrames: 30 },
            { id: 'focus-review', targetId: 'review-bars', kind: 'box', start: 132, duration: 54, label: 'comparison', minHoldFrames: 36 },
          ]}
        />
      </TechnicalScene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = { width: WIDTH, height: HEIGHT, fps: FPS, duration: DURATION };
