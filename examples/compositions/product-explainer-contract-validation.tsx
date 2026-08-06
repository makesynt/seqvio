import React from 'react';
import { VideoComposition, useCurrentFrame, type RenderableMeta } from '@seqvio/core';

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const DURATION = 180;

function ProductContractScene() {
  const frame = useCurrentFrame();
  const progress = Math.min(1, Math.max(0, (frame - 18) / 72));
  const result = Math.min(1, Math.max(0, (frame - 92) / 44));
  return (
    <div
      data-seqvio-product-explainer
      data-seqvio-on-screen-text-budget="1"
      style={{ width: WIDTH, height: HEIGHT, background: '#f5f7fa', color: '#17202a', fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden', position: 'relative' }}
    >
      <div data-seqvio-template="evidence-focus" style={{ position: 'absolute', inset: '60px 72px' }}>
        <div style={{ color: '#607080', fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>Product explainer contract</div>
        <h1 data-seqvio-text-role="primary" data-seqvio-text-id="headline" style={{ margin: '16px 0 0', width: 470, fontSize: 48, lineHeight: 1.05, letterSpacing: 0 }}>
          One beat. One focal point.
        </h1>
        <div
          id="evidence-graphic"
          data-seqvio-visual-role="graphic"
          data-seqvio-evidence-source="terminal-capture"
          style={{ position: 'absolute', left: 560, top: 42, width: 570, height: 470, border: '1px solid #c8d0d8', borderRadius: 8, background: '#121820', boxShadow: '0 18px 42px rgba(23,32,42,.14)' }}
        >
          <div style={{ height: 42, borderBottom: '1px solid #2d3742', display: 'flex', alignItems: 'center', padding: '0 18px', color: '#93a1b0', fontSize: 14 }}>
            verified-run.log
          </div>
          <div style={{ padding: 28, fontFamily: 'Consolas, monospace', color: '#c8d2dc', fontSize: 21, lineHeight: 1.8 }}>
            <div>$ seqvio verify contract</div>
            <div style={{ opacity: frame > 34 ? 1 : 0.15 }}>planning fields&nbsp;&nbsp;<span style={{ color: '#69d6a5' }}>ready</span></div>
            <div style={{ opacity: frame > 70 ? 1 : 0.15 }}>visual QA&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#69d6a5' }}>ready</span></div>
          </div>
          <div
            data-seqvio-focal-target
            style={{ position: 'absolute', left: 24, right: 24, top: 182, height: 58, border: '2px solid #4f8cff', borderRadius: 6, opacity: 0.35 + progress * 0.65, boxShadow: `0 0 ${18 * progress}px rgba(79,140,255,.35)` }}
          />
        </div>
        <div style={{ position: 'absolute', left: 0, top: 230, width: 430 }}>
          {[
            ['Hook', 'A concrete opening promise'],
            ['Evidence', 'Truthful captured source'],
            ['Transition', 'Focus follows meaning'],
          ].map(([label, detail], index) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: 18, padding: '18px 0', borderTop: '1px solid #d7dde3', opacity: Math.min(1, Math.max(0.28, (frame - 16 - index * 22) / 24)) }}>
              <span style={{ color: '#4f8cff', fontSize: 15, fontWeight: 700 }}>{label}</span>
              <span style={{ fontSize: 20 }}>{detail}</span>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 0, bottom: 36, display: 'flex', alignItems: 'center', gap: 12, color: '#435160', fontSize: 18, opacity: result }}>
          <span style={{ display: 'inline-block', width: 26, height: 3, background: '#4f8cff' }} />
          Planning and QA share one executable contract
        </div>
      </div>
    </div>
  );
}

export default function ProductExplainerContractValidation() {
  return (
    <VideoComposition id="product-explainer-contract-validation" width={WIDTH} height={HEIGHT} fps={FPS} duration={DURATION} backgroundColor="#f5f7fa">
      <ProductContractScene />
    </VideoComposition>
  );
}

export const meta: RenderableMeta = { width: WIDTH, height: HEIGHT, fps: FPS, duration: DURATION };
