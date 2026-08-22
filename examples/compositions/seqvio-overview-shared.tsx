import React, { type CSSProperties, type ReactNode } from 'react';
import { Scene, VideoComposition, useCurrentFrame } from '@seqvio/core';
import {
  DrawIcon,
  DrawShape,
  DrawText,
  Hand,
  WhiteboardScene,
  excalidrawTheme,
} from '@seqvio/whiteboard';
import {
  Doodle,
  PinnedList,
  ScatterScene,
  StickyNote,
} from '@seqvio/scatterbrain';
import {
  BrowserFrame,
  Callout,
  ProductDemoScene,
} from '@seqvio/product-demo';
import seqvioMark from '../../docs/assets/brand/seqvio-mark.svg';

const W = 1280;
const H = 720;
export const OVERVIEW_FPS = 30;

const C = {
  navy: '#0C1118',
  navy2: '#151C26',
  paper: '#F3F5F7',
  white: '#FCFDFE',
  ink: '#171A1F',
  muted: '#68717D',
  cyan: '#78DCF4',
  blue: '#3F9CF4',
  indigo: '#7A7FF2',
  amber: '#E8A23A',
  green: '#36B98A',
  rose: '#DF6D78',
};

const DARK_SURFACE = '#141B24';
const DARK_SURFACE_RAISED = '#19222E';
const DARK_BORDER = 'rgba(184, 205, 228, 0.16)';
const LIGHT_BORDER = '#D9DEE5';
const PANEL_RADIUS = 8;
const PANEL_SHADOW = '0 22px 60px rgba(7, 13, 22, 0.18)';

const UI_STACK = 'Inter, "Segoe UI", Arial, sans-serif';
const MONO_STACK = '"JetBrains Mono", "Cascadia Code", Consolas, monospace';
const LONG_CANG_STACK = '"Long Cang", "Noto Sans SC", "Microsoft YaHei", cursive';

export interface OverviewCopy {
  lang: 'en' | 'zh';
  hookTop: string;
  hookBottom: string;
  hookRail: string;
  promiseTitle: string;
  promiseRail: string;
  vocabulary: [string, string, string];
  promptLabel: string;
  promptText: string;
  promptRail: string;
  files: [string, string, string];
  ragTitle: string;
  ragSteps: [string, string, string, string];
  ragRail: string;
  stylesTitle: string;
  stylesRail: string;
  styleLabels: [string, string, string];
  styleNotes: [string, string, string, string];
  proofTitle: string;
  proofRail: string;
  checks: [string, string, string, string];
  closeKicker: string;
  closeTitle: string;
  closeRail: string;
  cta: string;
  /** Small teaser label on the hook player card, e.g. 'MADE BY AN AGENT'. */
  hookTeaser?: string;
  /** Badge shown on the scene-4 player reveal, e.g. 'RENDERED BY SEQVIO · UNEDITED'. */
  outputBadge?: string;
  /** File name shown in the scene-4 player chrome, e.g. 'technical-explainer.mp4'. */
  playerFile?: string;
  /** Install command shown on the closing scene, e.g. 'npm install -g @seqvio/renderer'. */
  ctaInstall?: string;
  /** Star prompt shown next to the install command, e.g. 'Star on GitHub'. */
  ctaStar?: string;
  /** Stdout lines under each proof command. */
  proofOutputs?: [string, string, string, string];
}

export interface OverviewProps {
  id: string;
  copy: OverviewCopy;
  sceneDurations: readonly [number, number, number, number, number, number, number];
  duration: number;
  audio: {
    fps: number;
    lockToAudio: true;
    narration: Array<{ id: string; sceneId: string; text: string }>;
  };
  /** Output stage size. Layout is authored at 1280x720 and scaled up uniformly. */
  stageWidth?: number;
  stageHeight?: number;
}

function ScaledOverviewStage({ children, scale }: { children: ReactNode; scale: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: W,
        height: H,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      }}
    >
      {children}
    </div>
  );
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeOut(value: number): number {
  const p = clamp(value);
  return 1 - Math.pow(1 - p, 3);
}

function reveal(frame: number, start: number, duration = 18, distance = 20): CSSProperties {
  const p = easeOut((frame - start) / duration);
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * distance}px) scale(${0.985 + p * 0.015})`,
    filter: `blur(${(1 - p) * 5}px)`,
  };
}

function BrandBug({ light = false }: { light?: boolean }) {
  return (
    <div style={{ position: 'absolute', left: 46, top: 34, zIndex: 40, display: 'flex', alignItems: 'center', gap: 10, color: light ? C.ink : '#EEF3F8', fontFamily: UI_STACK, fontSize: 22, fontWeight: 720 }}>
      <img src={seqvioMark} alt="" style={{ width: 35, height: 35, objectFit: 'contain' }} />
      <span>Seqvio</span>
    </div>
  );
}

function DarkStage({
  children,
  dense = false,
}: {
  children: ReactNode;
  dense?: boolean;
}) {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 52) * 6;
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: C.navy, color: C.white, fontFamily: UI_STACK }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.18, transform: `translateX(${drift}px)`, backgroundImage: 'linear-gradient(rgba(184,205,228,0.055) 1px, rgba(184,205,228,0) 1px), linear-gradient(90deg, rgba(184,205,228,0.055) 1px, rgba(184,205,228,0) 1px)', backgroundSize: '72px 72px' }} />
      <div style={{ position: 'absolute', left: 44, right: 44, top: 90, height: 1, background: DARK_BORDER }} />
      {dense ? (
        <>
          <div style={{ position: 'absolute', right: 46, top: 118, width: 220, height: 1, background: 'rgba(120,220,244,0.22)' }} />
          <div style={{ position: 'absolute', right: 46, top: 126, width: 120, height: 1, background: DARK_BORDER }} />
          <div style={{ position: 'absolute', left: 44, bottom: 104, width: 96, height: 3, borderRadius: 2, background: C.blue, opacity: 0.72 }} />
        </>
      ) : null}
      <BrandBug />
      {children}
    </div>
  );
}

function LightStage({
  children,
  dense = false,
}: {
  children: ReactNode;
  dense?: boolean;
}) {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: C.paper, color: C.ink, fontFamily: UI_STACK }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.23, backgroundImage: 'radial-gradient(#AEB7C2 0.8px, rgba(174,183,194,0) 0.8px)', backgroundPosition: `${frame % 36}px ${frame % 36}px`, backgroundSize: '36px 36px' }} />
      <div style={{ position: 'absolute', left: 44, right: 44, top: 90, height: 1, background: LIGHT_BORDER }} />
      {dense ? (
        <>
          <div style={{ position: 'absolute', right: 46, top: 118, width: 220, height: 1, background: '#C9D0D8' }} />
          <div style={{ position: 'absolute', right: 46, top: 126, width: 120, height: 1, background: '#E2E6EB' }} />
          <div style={{ position: 'absolute', right: 44, bottom: 108, width: 170, height: 5, borderRadius: 3, background: 'rgba(54,185,138,0.16)' }} />
        </>
      ) : null}
      <BrandBug light />
      {children}
    </div>
  );
}

function SoftSceneReveal({ light = false }: { light?: boolean }) {
  const frame = useCurrentFrame();
  const p = easeOut(frame / 10);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 90,
        pointerEvents: 'none',
        background: light ? C.paper : C.navy,
        opacity: 1 - p,
      }}
    />
  );
}

function HookScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 126 / Math.max(1, duration);
  const terminalP = easeOut((frame - 2) / 18);
  const commandP = easeOut((frame - 36) / 16);
  const outputP = easeOut((frame - 66) / 24);
  const progress = Math.min(100, Math.max(0, (frame - 58) * 2.1));
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: C.navy, color: C.white, fontFamily: UI_STACK }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.14, backgroundImage: 'linear-gradient(rgba(184,205,228,0.055) 1px, rgba(184,205,228,0) 1px), linear-gradient(90deg, rgba(184,205,228,0.055) 1px, rgba(184,205,228,0) 1px)', backgroundSize: '72px 72px' }} />
      <div style={{ position: 'absolute', left: 74, right: 74, top: 82, bottom: 74, opacity: terminalP, transform: `scale(${0.975 + terminalP * 0.025})`, border: `1px solid ${DARK_BORDER}`, borderRadius: PANEL_RADIUS, background: '#0E141C', boxShadow: '0 34px 90px rgba(0,0,0,0.38)', overflow: 'hidden' }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', borderBottom: `1px solid ${DARK_BORDER}`, background: DARK_SURFACE_RAISED }}>
          {[C.rose, C.amber, C.green].map((color) => <span key={color} style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />)}
          <span style={{ marginLeft: 12, color: '#8FA5C7', fontFamily: MONO_STACK, fontSize: 14 }}>agent-session / completed task</span>
          <span style={{ marginLeft: 'auto', color: C.green, fontFamily: MONO_STACK, fontSize: 12 }}>● VERIFIED</span>
        </div>
        <div style={{ padding: '34px 40px', fontFamily: MONO_STACK }}>
          <div style={{ color: '#D8E5FF', fontSize: 22, ...reveal(frame, 8, 18, 8) }}><span style={{ color: C.green }}>$</span> codex run technical-workflow</div>
          <div style={{ marginTop: 24, color: '#8296B6', fontSize: 17, lineHeight: 1.8, ...reveal(frame, 18, 18, 8) }}>
            <div><span style={{ color: C.green }}>✓</span> task complete</div>
            <div><span style={{ color: C.green }}>✓</span> evidence captured</div>
            <div><span style={{ color: C.green }}>✓</span> result verified</div>
          </div>
          <div style={{ marginTop: 32, color: '#EEF5FF', fontSize: 25, opacity: commandP, transform: `translateX(${(1 - commandP) * 18}px)` }}>
            <span style={{ color: C.green }}>$</span> /seqvio explain
            <span style={{ display: 'inline-block', width: 12, height: 27, marginLeft: 8, verticalAlign: '-4px', background: C.cyan, opacity: cursorOn ? 1 : 0.2 }} />
          </div>
          <div style={{ marginTop: 30, width: 740, height: 6, borderRadius: 3, background: '#253451', overflow: 'hidden', opacity: commandP }}>
            <div style={{ width: `${progress}%`, height: '100%', background: C.cyan }} />
          </div>
        </div>
        <div style={{ position: 'absolute', right: 38, bottom: 34, width: 330, height: 186, opacity: outputP, transform: `translateY(${(1 - outputP) * 18}px) scale(${0.94 + outputP * 0.06})`, border: `1px solid ${C.cyan}55`, borderRadius: 6, background: '#151E29', boxShadow: '0 20px 54px rgba(0,0,0,0.32)', overflow: 'hidden' }}>
          <div style={{ height: 34, padding: '9px 12px', color: '#8FA5C7', borderBottom: `1px solid ${DARK_BORDER}`, fontFamily: MONO_STACK, fontSize: 11 }}>explanation.preview</div>
          <div style={{ position: 'absolute', inset: '34px 0 0', display: 'grid', placeItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, fontFamily: MONO_STACK, fontWeight: 800 }}>
              <span style={{ color: C.blue }}>WORK</span>
              <span style={{ width: 54, height: 2, background: C.cyan }} />
              <span style={{ color: C.green }}>EXPLANATION</span>
            </div>
          </div>
        </div>
      </div>
      {enhanced ? <div style={{ position: 'absolute', left: 92, top: 38, color: '#91A4C4', fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 1.2, opacity: easeOut((frame - 78) / 18) }}>{copy.hookTeaser ?? 'MADE BY AN AGENT'}</div> : null}
    </div>
  );
}

function PromiseScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 168 / Math.max(1, duration);
  const flowP = easeOut((frame - 18) / 110);
  const previewP = easeOut((frame - 82) / 30);
  const stages = [
    { label: copy.vocabulary[0], color: C.amber, start: 24 },
    { label: copy.vocabulary[1], color: C.blue, start: 52 },
    { label: copy.vocabulary[2], color: C.green, start: 78 },
  ];
  return (
    <DarkStage dense={enhanced}>
      <div style={{ position: 'absolute', left: 86, top: 126, color: '#91A4C4', fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 1.3, ...reveal(frame, 6, 20, 8) }}>AGENT WORK</div>
      <div style={{ position: 'absolute', left: 86, top: 170, width: 360, height: 360, border: `1px solid ${DARK_BORDER}`, borderRadius: PANEL_RADIUS, background: '#0E141C', boxShadow: PANEL_SHADOW, overflow: 'hidden', ...reveal(frame, 10, 24, 14) }}>
        <div style={{ height: 42, padding: '12px 16px', borderBottom: `1px solid ${DARK_BORDER}`, color: '#8FA5C7', background: DARK_SURFACE_RAISED, fontFamily: MONO_STACK, fontSize: 12 }}>agent-session.log</div>
        <div style={{ padding: 24, color: '#B8C7E3', fontFamily: MONO_STACK, fontSize: 15, lineHeight: 2 }}>
          <div><span style={{ color: C.green }}>✓</span> task complete</div>
          <div><span style={{ color: C.green }}>✓</span> browser captured</div>
          <div><span style={{ color: C.green }}>✓</span> result verified</div>
          <div style={{ marginTop: 22, color: C.cyan }}>/seqvio explain</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 482, top: 222, width: 240, height: 258 }}>
        {stages.map((stage, index) => {
          const p = easeOut((frame - stage.start) / 22);
          return (
            <div key={stage.label} style={{ height: 66, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 14, opacity: p, transform: `translateX(${(1 - p) * 20}px)` }}>
              <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: '50%', border: `2px solid ${stage.color}`, color: stage.color, fontFamily: MONO_STACK, fontSize: 12, fontWeight: 900 }}>{String(index + 1).padStart(2, '0')}</span>
              <span style={{ color: stage.color, fontFamily: MONO_STACK, fontSize: 17, fontWeight: 800 }}>{stage.label}</span>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: 20, top: 42, width: 2, height: 176, background: `linear-gradient(${C.amber}, ${C.blue}, ${C.green})`, transform: `scaleY(${flowP})`, transformOrigin: 'top' }} />
      </div>
      <div style={{ position: 'absolute', right: 72, top: 144, width: 440, height: 420, opacity: previewP, transform: `translateX(${(1 - previewP) * 24}px) scale(${0.96 + previewP * 0.04})`, border: `1px solid ${C.cyan}55`, borderRadius: PANEL_RADIUS, background: '#111923', boxShadow: '0 28px 70px rgba(0,0,0,0.34)', overflow: 'hidden' }}>
        <div style={{ height: 44, padding: '13px 16px', borderBottom: `1px solid ${DARK_BORDER}`, color: '#8FA5C7', background: DARK_SURFACE_RAISED, fontFamily: MONO_STACK, fontSize: 12 }}>technical-explainer.mp4</div>
        <div style={{ position: 'relative', height: 322, background: '#F5F7F9', color: C.ink }}>
          <img src={seqvioMark} alt="" style={{ position: 'absolute', left: 168, top: 58, width: 104, height: 104, objectFit: 'contain' }} />
          <div style={{ position: 'absolute', left: 66, right: 66, top: 196, display: 'flex', justifyContent: 'space-between', color: C.muted, fontFamily: MONO_STACK, fontSize: 12, fontWeight: 800 }}>
            {copy.vocabulary.map((label) => <span key={label}>{label}</span>)}
          </div>
          <div style={{ position: 'absolute', left: 66, right: 66, top: 226, height: 3, background: '#DCE3EA' }}><span style={{ display: 'block', width: `${Math.min(100, Math.max(0, (frame - 88) * 2.5))}%`, height: '100%', background: C.green }} /></div>
        </div>
        <div style={{ height: 54, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', color: '#8FA5C7', fontFamily: MONO_STACK, fontSize: 12 }}><span style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: `10px solid ${C.cyan}` }} /> WORK → EXPLANATION</div>
      </div>
    </DarkStage>
  );
}

function TerminalWindow({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: 66, top: 122, width: 748, height: 454, background: '#0E141C', border: `1px solid ${DARK_BORDER}`, borderRadius: PANEL_RADIUS, boxShadow: PANEL_SHADOW, overflow: 'hidden' }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 9, padding: '0 16px', borderBottom: `1px solid ${DARK_BORDER}`, background: DARK_SURFACE_RAISED }}>
        {[C.rose, C.amber, C.green].map((color) => <span key={color} style={{ width: 11, height: 11, borderRadius: '50%', background: color }} />)}
        <span style={{ marginLeft: 12, fontFamily: MONO_STACK, fontSize: 15, color: '#91A4C4' }}>agent / seqvio</span>
      </div>
      {children}
    </div>
  );
}

function PromptScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 228 / Math.max(1, duration);
  return (
    <LightStage dense={enhanced}>
      <TerminalWindow>
        <div style={{ padding: 30, fontFamily: MONO_STACK, color: '#D8E5FF' }}>
          <div style={{ fontSize: 18, color: C.green, ...reveal(frame, 8, 18) }}>$ codex</div>
          <div style={{ marginTop: 24, fontSize: 27, lineHeight: 1.48, ...reveal(frame, 28, 26) }}><span style={{ color: C.cyan }}>&gt; </span>{copy.promptText}</div>
          <div style={{ marginTop: 30, fontSize: 17, color: '#8FA5C7', ...reveal(frame, 78, 22) }}>/seqvio&nbsp;&nbsp;planning explainer structure...</div>
          <div style={{ marginTop: 18, height: 5, borderRadius: 3, background: '#25303D', overflow: 'hidden', ...reveal(frame, 100, 16) }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (frame - 100) * 1.6))}%`, height: '100%', borderRadius: 3, background: C.blue }} />
          </div>
        </div>
      </TerminalWindow>
      {enhanced ? (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <path d="M790 254 C824 254 818 208 842 208" fill="none" stroke={C.blue} strokeWidth="3" strokeDasharray="8 8" opacity="0.58" />
          <path d="M790 342 C826 342 818 327 842 327" fill="none" stroke={C.indigo} strokeWidth="3" strokeDasharray="8 8" opacity="0.52" />
          <path d="M790 430 C828 430 818 446 842 446" fill="none" stroke={C.green} strokeWidth="3" strokeDasharray="8 8" opacity="0.52" />
        </svg>
      ) : null}
      <div style={{ position: 'absolute', left: 858, top: 142, width: 332 }}>
        {copy.files.map((file, index) => (
          <div key={file} style={{ height: 88, marginBottom: 16, padding: '16px 18px', border: `1px solid ${LIGHT_BORDER}`, borderRadius: 6, background: 'rgba(252,253,254,0.94)', boxShadow: '0 14px 34px rgba(24,32,43,0.08)', fontFamily: MONO_STACK, fontSize: 17, fontWeight: 680, display: 'flex', alignItems: 'center', ...reveal(frame, 104 + index * 28, 22, 18) }}>
            <span style={{ width: 34, height: 34, marginRight: 14, display: 'grid', placeItems: 'center', borderRadius: 5, color: C.white, background: index === 0 ? C.blue : index === 1 ? C.indigo : C.green, fontSize: 12 }}>{String(index + 1).padStart(2, '0')}</span>{file}
          </div>
        ))}
      </div>
      {enhanced ? (
        <div style={{ position: 'absolute', left: 858, top: 454, width: 332, display: 'flex', alignItems: 'center', gap: 12, color: C.muted, fontFamily: MONO_STACK, fontSize: 12, ...reveal(frame, 176, 20, 8) }}>
          <span style={{ color: C.blue }}>TASK</span><span style={{ flex: 1, height: 1, background: LIGHT_BORDER }} /><span style={{ color: C.green }}>EXPLAINER DOCUMENT</span>
        </div>
      ) : null}
    </LightStage>
  );
}

function RagExplanationScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame();
  // Enhanced (product-hunt) scenes reserve a tail after the narration-locked
  // drawing, used to pull back and reveal the whiteboard as a rendered file.
  const tail = enhanced ? 45 : 0;
  const drawDuration = duration - tail;
  const t = (frame: number) => Math.max(1, Math.round(frame * drawDuration / 330));
  const pull = enhanced ? easeOut((frame - (drawDuration - 18)) / 40) : 0;
  const badgeP = enhanced ? easeOut((frame - (drawDuration + 4)) / 16) : 0;
  const boardScale = 1 - pull * 0.34;
  const boardW = W * boardScale;
  const boardH = H * boardScale;
  const boardX = (W - boardW) / 2;
  const boardY = (H - boardH) / 2;
  const clipNow = Math.min(9, Math.floor(Math.min(1, frame / drawDuration) * 9));
  const actionLabels = copy.lang === 'zh'
    ? ['规划', '锚定', '聚焦', '验证']
    : ['PLAN', 'ANCHOR', 'FOCUS', 'VERIFY'];
  const icons = ['lightbulb', 'plus', 'document', 'check'];
  const visualLink = copy.lang === 'zh' ? '旁白 ↔ 视觉动作' : 'VOICE ↔ VISUAL ACTION';
  return (
    <div
      style={{
        position: 'relative',
        width: W,
        height: H,
        overflow: 'hidden',
        background: '#FBFCFE',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: '#E7ECF4', opacity: pull }} />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: W,
          height: H,
          transform: `translate(-50%, -50%) scale(${boardScale})`,
        }}
      >
      <WhiteboardScene
        width={W}
        height={H}
        texture="whiteboard"
        theme={excalidrawTheme}
        singlePen={false}
      >
        <DrawText
          text={copy.ragTitle}
          position={{ x: 88, y: 126 }}
          fontSize={43}
          fontWeight="bold"
          strokeColor={C.ink}
          start={t(8)}
          duration={t(28)}
        />
        <DrawShape
          type="underline"
          position={{ x: 88, y: 166 }}
          size={428}
          strokeColor={C.blue}
          strokeWidth={4}
          start={t(38)}
          duration={t(18)}
        />
        {enhanced ? (
          <>
            <DrawShape type="line" from={{ x: 118, y: 346 }} to={{ x: 1144, y: 346 }} strokeColor="#D7DEEA" strokeWidth={1.6} start={t(48)} duration={t(28)} />
            <DrawShape type="star" position={{ x: 1180, y: 202 }} size={34} strokeColor={C.amber} fillColor="none" strokeWidth={2.4} start={t(42)} duration={t(18)} />
            <DrawShape type="circle" position={{ x: 1138, y: 226 }} size={18} strokeColor={C.rose} fillColor="none" strokeWidth={2} start={t(50)} duration={t(14)} />
          </>
        ) : null}
        {copy.ragSteps.map((label, index) => {
          const x = 76 + index * 298;
          const color = [C.blue, C.indigo, C.amber, C.green][index];
          const isEndpoint = index === 0 || index === 3;
          const shapeType = isEndpoint
            ? 'circle'
            : index === 1
              ? 'rounded-rectangle'
              : 'rectangle';
          return (
            <React.Fragment key={label}>
              {enhanced ? (
                <>
                  <DrawText
                    text={String(index + 1).padStart(2, '0')}
                    position={{ x: x + 103, y: 236 }}
                    align="center"
                    fontSize={17}
                    fontWeight="bold"
                    strokeColor={color}
                    start={t(50 + index * 58)}
                    duration={t(14)}
                  />
                  <DrawText
                    text={actionLabels[index]}
                    position={{ x: x + 103, y: 258 }}
                    align="center"
                    fontSize={15}
                    fontWeight="bold"
                    strokeColor={C.muted}
                    start={t(56 + index * 58)}
                    duration={t(12)}
                  />
                </>
              ) : null}
              <DrawShape
                type={shapeType}
                position={isEndpoint ? { x: x + 103, y: 346 } : { x, y: 276 }}
                size={isEndpoint ? 140 : { width: 206, height: 140 }}
                strokeColor={color}
                fillColor="none"
                strokeWidth={3}
                start={t(58 + index * 58)}
                duration={t(24)}
              />
              {enhanced ? (
                <DrawIcon
                  name={icons[index]}
                  position={{ x: x + 75, y: 318 }}
                  size={56}
                  strokeColor={isEndpoint || index === 2 ? C.white : color}
                  strokeWidth={2.8}
                  start={t(76 + index * 58)}
                  duration={t(18)}
                />
              ) : null}
              <DrawText
                text={label}
                position={{ x: x + 103, y: 452 }}
                align="center"
                fontSize={25}
                fontWeight="bold"
                strokeColor={C.ink}
                start={t(84 + index * 58)}
                duration={t(18)}
              />
              {index < 3 ? (
                <DrawShape
                  type="arrow"
                  from={{ x: x + 214, y: 346 }}
                  to={{ x: x + 286, y: 346 }}
                  strokeColor={C.muted}
                  strokeWidth={2.6}
                  start={t(104 + index * 58)}
                  duration={t(12)}
                />
              ) : null}
            </React.Fragment>
          );
        })}
        <DrawText
          text={visualLink}
          position={{ x: 640, y: 546 }}
          align="center"
          fontSize={25}
          fontWeight="bold"
          strokeColor={C.ink}
          start={t(280)}
          duration={t(24)}
        />
        <DrawShape
          type="underline"
          position={{ x: 370, y: 584 }}
          size={540}
          strokeColor={C.rose}
          strokeWidth={4}
          start={t(308)}
          duration={t(16)}
        />
        {frame < t(324) ? <Hand action="write" follow visible size={42} /> : null}
      </WhiteboardScene>
      </div>
      {enhanced && pull > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: boardX - 3,
            top: boardY - 49,
            width: boardW + 6,
            opacity: pull,
            zIndex: 20,
            border: `1px solid ${DARK_BORDER}`,
            borderRadius: PANEL_RADIUS,
            boxShadow: PANEL_SHADOW,
            overflow: 'hidden',
          }}
        >
          <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: DARK_SURFACE_RAISED, borderBottom: `1px solid ${DARK_BORDER}` }}>
            {[C.rose, C.amber, C.green].map((color) => <span key={color} style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />)}
            <span style={{ marginLeft: 10, fontFamily: MONO_STACK, fontSize: 14, color: '#8FA5C7' }}>{copy.playerFile ?? 'technical-explainer.mp4'}</span>
            <span style={{ marginLeft: 'auto', padding: '3px 8px', border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: MONO_STACK, fontSize: 11, fontWeight: 700 }}>1080p</span>
          </div>
          <div style={{ height: boardH - 6 }} />
          <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: DARK_SURFACE_RAISED, borderTop: `1px solid ${DARK_BORDER}` }}>
            <span style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: `10px solid ${C.cyan}` }} />
            <span style={{ flex: 1, height: 5, background: '#253451', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, (frame / drawDuration) * 100)}%`, background: C.cyan }} />
            </span>
            <span style={{ fontFamily: MONO_STACK, fontSize: 12, color: '#8FA5C7' }}>00:0{clipNow} / 00:09</span>
          </div>
        </div>
      ) : null}
      {enhanced && copy.outputBadge ? (
        <div
          style={{
            position: 'absolute',
            left: boardX + boardW - 330,
            top: boardY + boardH - 96,
            zIndex: 30,
            padding: '10px 16px',
            border: `1px solid ${C.green}55`,
            borderRadius: 4,
            background: '#E8F7F1',
            color: '#157052',
            fontFamily: MONO_STACK,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 0.6,
            whiteSpace: 'nowrap',
            transform: `translateY(${(1 - badgeP) * 14}px)`,
            opacity: badgeP,
            boxShadow: '0 14px 30px rgba(16,24,40,0.3)',
          }}
        >
          ● {copy.outputBadge}
        </div>
      ) : null}
      <BrandBug light />
    </div>
  );
}

function MiniWhiteboard({ copy }: { copy: OverviewCopy }) {
  return (
    <WhiteboardScene
      width={344}
      height={330}
      texture="whiteboard"
      theme={excalidrawTheme}
      singlePen={false}
    >
      <DrawText
        text="MODEL"
        position={{ x: 34, y: 48 }}
        fontSize={38}
        fontWeight="bold"
        strokeColor={C.blue}
        start={18}
        duration={24}
      />
      <DrawIcon
        name="lightbulb"
        position={{ x: 34, y: 128 }}
        size={54}
        strokeColor={C.blue}
        start={48}
        duration={22}
      />
      <DrawShape
        type="arrow"
        from={{ x: 104, y: 156 }}
        to={{ x: 194, y: 156 }}
        strokeColor={C.indigo}
        start={72}
        duration={20}
      />
      <DrawIcon
        name="document"
        position={{ x: 224, y: 128 }}
        size={54}
        strokeColor={C.green}
        start={94}
        duration={22}
      />
      <DrawText
        text={copy.styleNotes[0]}
        position={{ x: 172, y: 245 }}
        align="center"
        fontSize={22}
        strokeColor={C.ink}
        start={122}
        duration={24}
      />
    </WhiteboardScene>
  );
}

function MiniScatter({ copy }: { copy: OverviewCopy }) {
  return (
    <ScatterScene
      width={344}
      height={330}
      surface="warm"
      style={{ fontFamily: copy.lang === 'zh' ? LONG_CANG_STACK : UI_STACK }}
    >
      <PinnedList
        items={[copy.styleNotes[1], copy.styleNotes[2], copy.styleNotes[3]]}
        position={{ x: 22, y: 34 }}
        itemWidth={220}
        gap={8}
        start={16}
        stagger={28}
        fontSize={20}
      />
      <StickyNote
        position={{ x: 236, y: 164 }}
        width={96}
        color="blue"
        rotate={4}
        attach="pin"
        start={108}
        duration={20}
        style={{ padding: 12 }}
      >
        PLAN
      </StickyNote>
      <Doodle
        type="arrow"
        position={{ x: 214, y: 104 }}
        size={86}
        color={C.rose}
        rotate={15}
        start={132}
        duration={24}
      />
    </ScatterScene>
  );
}

function MiniGraphics() {
  return (
    <div style={{ position: 'relative', width: 344, height: 330, padding: 22, color: '#E7F0FF', background: '#111A27', fontFamily: MONO_STACK, overflow: 'hidden' }}>
      <div style={{ color: C.cyan, fontSize: 13, fontWeight: 900, letterSpacing: 1.2 }}>INFOGRAPHIC / MANIM</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        {['4.8x', '120ms', '0.7%'].map((value, index) => (
          <div key={value} style={{ flex: 1, padding: '10px 8px', border: `1px solid ${DARK_BORDER}`, background: '#1B2738' }}>
            <div style={{ color: [C.blue, C.green, C.amber][index], fontSize: 18, fontWeight: 900 }}>{value}</div>
            <div style={{ marginTop: 4, color: '#91A4C4', fontSize: 9 }}>{['THROUGHPUT', 'LATENCY', 'ERRORS'][index]}</div>
          </div>
        ))}
      </div>
      <svg width="300" height="142" viewBox="0 0 300 142" style={{ display: 'block', marginTop: 22 }} aria-hidden="true">
        <path d="M8 118 C58 112 74 94 110 94 S166 77 192 52 S246 38 292 14" fill="none" stroke={C.cyan} strokeWidth="4" />
        <path d="M8 122 H292 M8 122 V12" fill="none" stroke="#536A86" strokeWidth="1" />
        <circle cx="192" cy="52" r="6" fill={C.green} />
      </svg>
      <div style={{ position: 'absolute', left: 22, right: 22, bottom: 22, display: 'flex', justifyContent: 'space-between', color: '#91A4C4', fontSize: 11 }}>
        <span>EXPLANATORY GRAPHICS</span><span style={{ color: C.green }}>EQUATION → RESULT</span>
      </div>
    </div>
  );
}

function MiniProductDemo() {
  return (
    <ProductDemoScene width={344} height={330} background="#EEF2F6">
      <BrowserFrame
        position={{ x: 18, y: 38 }}
        width={308}
        height={248}
        url="workflow.local"
        title="captured evidence"
        start={18}
        duration={22}
      >
        <div style={{ padding: 18, fontFamily: UI_STACK }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>
            Captured workflow
          </div>
          <div style={{ marginTop: 16, height: 10, width: 230, background: '#DCE5F3' }} />
          <div style={{ marginTop: 9, height: 10, width: 186, background: '#DCE5F3' }} />
          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            {['STEP', 'CHECK', 'OK'].map((item, index) => (
              <div
                key={item}
                style={{
                  width: 72,
                  height: 58,
                  display: 'grid',
                  placeItems: 'center',
                  color: C.white,
                  background: [C.blue, C.indigo, C.green][index],
                  fontWeight: 800,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </BrowserFrame>
      <Callout
        text="load verified"
        position={{ x: 182, y: 236 }}
        width={132}
        start={92}
        duration={18}
        accent={C.green}
      />
    </ProductDemoScene>
  );
}

function StylesScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 258 / Math.max(1, duration);
  const views = [
    { label: copy.styleLabels[0], short: 'MODEL', child: <MiniWhiteboard copy={copy} />, color: C.blue, start: 16 },
    { label: copy.styleLabels[1], short: 'GRAPHICS', child: <MiniGraphics />, color: C.amber, start: 88 },
    { label: copy.styleLabels[2], short: 'EVIDENCE', child: <MiniProductDemo />, color: C.green, start: 160 },
  ];
  return (
    <LightStage dense={enhanced}>
      <div style={{ position: 'absolute', left: 74, top: 112, color: C.muted, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 1.2, ...reveal(frame, 4, 20, 8) }}>ONE IDEA. ONE VISUAL.</div>
      <div style={{ position: 'absolute', left: 66, top: 154, width: 770, height: 472, border: `1px solid ${LIGHT_BORDER}`, borderRadius: PANEL_RADIUS, background: '#EEF2F6', boxShadow: '0 24px 62px rgba(24,32,43,0.13)', overflow: 'hidden' }}>
        {views.map((view, index) => {
          const enter = easeOut((frame - view.start) / 20);
          const exit = index < views.length - 1 ? easeOut((frame - (view.start + 58)) / 14) : 0;
          const opacity = enter * (1 - exit);
          return (
            <div key={view.label} style={{ position: 'absolute', inset: 0, opacity, transform: `scale(${0.97 + opacity * 0.03})`, display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 344, height: 330, transform: 'scale(1.34)', transformOrigin: 'center' }}>{view.child}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 894, top: 178, width: 306 }}>
        {views.map((view, index) => {
          const p = easeOut((frame - view.start) / 20);
          const active = frame >= view.start && (index === views.length - 1 || frame < views[index + 1].start);
          return (
            <div key={view.label} style={{ position: 'relative', marginBottom: 30, paddingLeft: 30, opacity: active ? 1 : 0.28, transform: `translateX(${(1 - p) * 12}px)`, transition: 'none' }}>
              <span style={{ position: 'absolute', left: 0, top: 8, width: 12, height: 12, borderRadius: '50%', border: `2px solid ${view.color}`, background: active ? view.color : C.paper }} />
              <div style={{ color: view.color, fontFamily: MONO_STACK, fontSize: 15, fontWeight: 900 }}>{view.short}</div>
              <div style={{ marginTop: 7, color: C.ink, fontSize: 20, lineHeight: 1.25, fontWeight: 720 }}>{view.label}</div>
            </div>
          );
        })}
        <div style={{ marginTop: 22, height: 3, background: '#DCE3EA' }}><span style={{ display: 'block', width: `${Math.min(100, Math.max(0, frame / 2.3))}%`, height: '100%', background: C.green }} /></div>
      </div>
    </LightStage>
  );
}

function ProofScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 246 / Math.max(1, duration);
  const commands = [
    'seqvio validate explainer.json',
    'seqvio align --voice audio.json',
    'seqvio qa --layout --media --evidence',
    'seqvio render technical-explainer.tsx',
  ];
  return (
    <DarkStage dense={enhanced}>
      <div style={{ position: 'absolute', left: 76, top: 112, color: '#91A4C4', fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 1.2, ...reveal(frame, 4, 20, 8) }}>LOCAL RENDER / AUTOMATED CHECKS</div>
      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 152,
          width: 744,
          height: 438,
          background: '#0E141C',
          border: `1px solid ${DARK_BORDER}`,
          borderRadius: PANEL_RADIUS,
          boxShadow: PANEL_SHADOW,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 42,
            padding: '11px 16px',
            color: '#8FA5C7',
            fontFamily: MONO_STACK,
            fontSize: 15,
            borderBottom: `1px solid ${DARK_BORDER}`,
            background: DARK_SURFACE_RAISED,
          }}
        >
          seqvio / render
          {enhanced ? <span style={{ float: 'right', color: C.green }}>RUNNING LOCALLY</span> : null}
        </div>
        <div style={{ position: 'relative', padding: '30px 26px', fontFamily: MONO_STACK }}>
          {enhanced ? <div style={{ position: 'absolute', left: 36, top: 36, bottom: 46, width: 2, background: 'linear-gradient(180deg, #38B6FF, #6E7BFF, #F4B740, #32D583)' }} /> : null}
          {commands.map((command, index) => (
            <div
              key={command}
              style={{
                position: 'relative',
                paddingLeft: enhanced ? 30 : 0,
                marginBottom: 32,
                fontSize: 18,
                color: '#D8E5FF',
                ...reveal(frame, 24 + index * 38, 18, 10),
              }}
            >
              {enhanced ? <span style={{ position: 'absolute', left: -2, top: 1, width: 20, height: 20, display: 'grid', placeItems: 'center', borderRadius: '50%', color: C.navy, background: [C.blue, C.indigo, C.amber, C.green][index], fontSize: 11, fontWeight: 900 }}>{index + 1}</span> : null}
              <span style={{ color: C.green }}>$ </span>
              {command}
              <span style={{ marginLeft: 14, color: C.green }}>✓</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 866, top: 152, width: 324 }}>
        <div style={{ padding: '20px 22px', border: `1px solid ${DARK_BORDER}`, borderRadius: PANEL_RADIUS, background: DARK_SURFACE, boxShadow: '0 18px 44px rgba(5,10,17,0.18)' }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                height: 62,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                borderBottom: index < 3 ? `1px solid ${DARK_BORDER}` : 'none',
                ...reveal(frame, 54 + index * 24, 18, 14),
              }}
            >
              <span style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: `2px solid ${[C.blue, C.indigo, C.amber, C.green][index]}`, borderRadius: '50%', color: [C.blue, C.indigo, C.amber, C.green][index], fontSize: 14, fontWeight: 900 }}>✓</span>
              <span style={{ color: '#D8E5FF', fontFamily: MONO_STACK, fontSize: 16 }}>{copy.checks[index]}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 22,
            padding: '22px 18px',
            border: `1px solid ${C.green}66`,
            borderRadius: PANEL_RADIUS,
            background: 'rgba(54,185,138,0.06)',
            color: C.green,
            fontFamily: MONO_STACK,
            fontSize: 17,
            textAlign: 'center',
            ...reveal(frame, 154, 20),
          }}
        >
          {enhanced ? <span style={{ display: 'inline-block', marginRight: 12, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: `12px solid ${C.green}` }} /> : null}
          output/technical-explainer.mp4
          <div style={{ marginTop: 9, fontSize: 12.5, color: '#7E93BC', fontWeight: 400 }}>1920×1080 · H.264 · VERIFIED</div>
        </div>
      </div>
    </DarkStage>
  );
}

function ClosingScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 228 / Math.max(1, duration);
  const p = easeOut((frame - 18) / 30);
  const raysP = easeOut((frame - 44) / 28);
  return (
    <DarkStage>
      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 176,
          width: 720,
          ...reveal(frame, 8, 26),
        }}
      >
        <div
          style={{
            fontSize: 72,
            lineHeight: 1.04,
            fontWeight: 880,
          }}
        >
          {copy.closeTitle}
        </div>
        <div
          style={{
            marginTop: 42,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 20px',
            border: `1px solid ${C.cyan}66`,
            borderRadius: 6,
            background: 'rgba(120,220,244,0.055)',
            color: C.cyan,
            fontFamily: MONO_STACK,
            fontSize: 18,
            ...reveal(frame, 82, 24),
          }}
        >
          {copy.cta}
        </div>
        {copy.ctaInstall ? (
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              ...reveal(frame, 102, 24),
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}`, borderRadius: 6, color: '#D8E5FF', fontFamily: MONO_STACK, fontSize: 16 }}>
              <span style={{ color: C.green }}>$</span>
              {copy.ctaInstall}
            </div>
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 92,
          top: 174,
          width: 310,
          height: 310,
          transform: `scale(${0.82 + p * 0.18})`,
          opacity: p,
        }}
      >
        {enhanced ? (
          <svg width="310" height="310" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
              const angle = index * Math.PI / 4;
              const inner = 166 + raysP * 10;
              const outer = 174 + raysP * 30;
              return <line key={index} x1={155 + Math.cos(angle) * inner} y1={155 + Math.sin(angle) * inner} x2={155 + Math.cos(angle) * outer} y2={155 + Math.sin(angle) * outer} stroke={index % 2 ? C.indigo : C.cyan} strokeWidth={index % 3 === 0 ? 4 : 2} opacity={0.52 * raysP} />;
            })}
          </svg>
        ) : null}
        <img src={seqvioMark} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      {enhanced && !copy.ctaInstall ? (
        <div style={{ position: 'absolute', left: 76, top: 548, display: 'flex', gap: 12, ...reveal(frame, 104, 24, 10) }}>
          {copy.styleLabels.map((label, index) => (
            <span key={label} style={{ minWidth: 178, padding: '10px 14px', border: `1px solid ${[C.blue, C.amber, C.green][index]}55`, borderRadius: 5, color: [C.blue, C.amber, C.green][index], background: 'rgba(255,255,255,0.035)', fontFamily: MONO_STACK, fontSize: 13, fontWeight: 750, textAlign: 'center' }}>{label}</span>
          ))}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 76,
          right: 76,
          bottom: 46,
          height: 1,
          background: DARK_BORDER,
        }}
      />
    </DarkStage>
  );
}

export function SeqvioOverview({
  id,
  copy,
  sceneDurations,
  duration,
  audio,
  stageWidth = W,
  stageHeight = H,
}: OverviewProps) {
  const [hook, promise, prompt, explanation, styles, proof, closing] = sceneDurations;
  const enhanced = id.includes('product-hunt');
  const scale = stageWidth / W;
  return (
    <VideoComposition
      id={id}
      width={stageWidth}
      height={stageHeight}
      fps={OVERVIEW_FPS}
      duration={duration}
      backgroundColor={C.navy}
      audio={audio}
    >
      <Scene id="hook" duration={hook}>
        <ScaledOverviewStage scale={scale}><HookScene copy={copy} duration={hook} enhanced={enhanced} /></ScaledOverviewStage>
      </Scene>
      <Scene id="promise" duration={promise}>
        <ScaledOverviewStage scale={scale}><PromiseScene copy={copy} duration={promise} enhanced={enhanced} /><SoftSceneReveal /></ScaledOverviewStage>
      </Scene>
      <Scene id="prompt" duration={prompt}>
        <ScaledOverviewStage scale={scale}><PromptScene copy={copy} duration={prompt} enhanced={enhanced} /><SoftSceneReveal light /></ScaledOverviewStage>
      </Scene>
      <Scene id="explanation" duration={explanation}>
        <ScaledOverviewStage scale={scale}><RagExplanationScene copy={copy} duration={explanation} enhanced={enhanced} /><SoftSceneReveal light /></ScaledOverviewStage>
      </Scene>
      <Scene id="styles" duration={styles}>
        <ScaledOverviewStage scale={scale}><StylesScene copy={copy} duration={styles} enhanced={enhanced} /><SoftSceneReveal light /></ScaledOverviewStage>
      </Scene>
      <Scene id="proof" duration={proof}>
        <ScaledOverviewStage scale={scale}><ProofScene copy={copy} duration={proof} enhanced={enhanced} /><SoftSceneReveal /></ScaledOverviewStage>
      </Scene>
      <Scene id="closing" duration={closing}>
        <ScaledOverviewStage scale={scale}><ClosingScene copy={copy} duration={closing} enhanced={enhanced} /><SoftSceneReveal /></ScaledOverviewStage>
      </Scene>
    </VideoComposition>
  );
}
