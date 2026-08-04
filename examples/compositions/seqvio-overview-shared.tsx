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
import seqvioIcon from '../../docs/assets/brand/seqvio-icon.svg';
import seqvioIconSmall from '../../docs/assets/brand/seqvio-icon-small.svg';

const W = 1280;
const H = 720;
export const OVERVIEW_FPS = 30;

const C = {
  navy: '#0B1020',
  navy2: '#131C35',
  paper: '#F6F8FC',
  white: '#FFFFFF',
  ink: '#101828',
  muted: '#667085',
  cyan: '#5EE7FF',
  blue: '#38B6FF',
  indigo: '#6E7BFF',
  amber: '#F4B740',
  green: '#32D583',
  rose: '#FF6B7A',
};

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
  /** File name shown in the scene-4 player chrome, e.g. 'rag-explainer.mp4'. */
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
    transform: `translateY(${(1 - p) * distance}px) scale(${0.97 + p * 0.03})`,
  };
}

function BrandBug({ light = false }: { light?: boolean }) {
  return (
    <div style={{ position: 'absolute', left: 42, top: 32, zIndex: 40, display: 'flex', alignItems: 'center', gap: 13, color: light ? C.ink : C.white, fontFamily: UI_STACK, fontSize: 24, fontWeight: 750 }}>
      <img src={seqvioIconSmall} alt="" style={{ width: 44, height: 44 }} />
      <span>Seqvio</span>
    </div>
  );
}

function Rail({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div style={{ position: 'absolute', zIndex: 50, left: 60, right: 60, bottom: 28, minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 22px', borderTop: `2px solid ${light ? '#D7DEEA' : 'rgba(94,231,255,0.34)'}`, color: light ? C.ink : '#E9F7FF', fontFamily: UI_STACK, fontSize: 27, lineHeight: 1.25, textAlign: 'center', fontWeight: 650 }}>
      {children}
    </div>
  );
}

function SceneMeta({
  index,
  label,
  light = false,
}: {
  index: string;
  label: string;
  light?: boolean;
}) {
  const color = light ? C.ink : '#D9E8FF';
  const line = light ? '#B9C5D8' : 'rgba(94,231,255,0.42)';
  return (
    <div
      style={{
        position: 'absolute',
        right: 54,
        top: 36,
        zIndex: 45,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color,
        fontFamily: MONO_STACK,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 1.2,
      }}
    >
      <span style={{ width: 42, height: 28, display: 'grid', placeItems: 'center', border: `2px solid ${line}` }}>{index}</span>
      <span>{label}</span>
      <span style={{ width: 54, height: 2, background: line }} />
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
  const drift = Math.sin(frame / 34) * 10;
  const sweep = (frame * 1.8) % 420;
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: C.navy, color: C.white, fontFamily: UI_STACK }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.24, transform: `translateX(${drift}px)`, backgroundImage: 'linear-gradient(rgba(94,231,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(94,231,255,0.10) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      <div style={{ position: 'absolute', width: 480, height: 480, right: -120 + drift, top: -190, border: '2px solid rgba(110,123,255,0.24)', borderRadius: '50%' }} />
      {dense ? (
        <>
          <div style={{ position: 'absolute', left: -300, top: 250, width: 400, height: 400, border: '1px dashed rgba(94,231,255,0.18)', borderRadius: '50%', transform: `rotate(${frame * 0.12}deg)` }} />
          <div style={{ position: 'absolute', left: 312, top: -120, width: 2, height: 420, background: 'rgba(110,123,255,0.18)', transform: 'rotate(36deg)', transformOrigin: 'top center' }} />
          <div style={{ position: 'absolute', right: 56, top: 112, width: 190, height: 7, borderTop: '2px solid rgba(94,231,255,0.28)', borderBottom: '2px solid rgba(94,231,255,0.14)' }} />
          <div style={{ position: 'absolute', left: 0, top: 96 + sweep, width: 54, height: 2, background: C.cyan, opacity: 0.5 }} />
          {[0, 1, 2, 3, 4].map((index) => (
            <span key={index} style={{ position: 'absolute', right: 36 + index * 34, bottom: 104, width: 8, height: 8, border: `2px solid ${index % 2 ? C.indigo : C.cyan}`, transform: `rotate(${45 + index * 9}deg)`, opacity: 0.42 }} />
          ))}
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
      <div style={{ position: 'absolute', inset: 0, opacity: 0.32, backgroundImage: 'radial-gradient(#B9C5D8 1px, transparent 1px)', backgroundPosition: `${frame % 28}px ${frame % 28}px`, backgroundSize: '28px 28px' }} />
      {dense ? (
        <>
          <div style={{ position: 'absolute', left: -150, top: 150, width: 360, height: 360, border: '30px solid rgba(56,182,255,0.07)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', right: -88, top: 96, width: 290, height: 290, border: '2px dashed rgba(110,123,255,0.20)', transform: `rotate(${frame * 0.16}deg)` }} />
          <div style={{ position: 'absolute', right: 42, bottom: 112, width: 210, height: 12, background: 'rgba(50,213,131,0.12)', transform: 'skewX(-24deg)' }} />
          <div style={{ position: 'absolute', left: 54, right: 54, top: 88, height: 2, background: 'linear-gradient(90deg, rgba(56,182,255,0.52), rgba(110,123,255,0.12), transparent)' }} />
        </>
      ) : null}
      <BrandBug light />
      {children}
    </div>
  );
}

function HookScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 126 / Math.max(1, duration);
  const fragments = [
    { label: 'CLIP 01', x: 112, y: 180, color: C.indigo, delay: 0 },
    { label: 'B-ROLL', x: 922, y: 144, color: C.amber, delay: 6 },
    { label: 'MOTION', x: 850, y: 430, color: C.blue, delay: 12 },
    { label: 'FX', x: 160, y: 452, color: C.rose, delay: 18 },
  ];
  const focus = easeOut((frame - 52) / 28);
  return (
    <DarkStage dense={enhanced}>
      {enhanced ? (
        <>
          <SceneMeta index="01" label="THE PROBLEM" />
          <div style={{ position: 'absolute', left: 76, top: 112, display: 'flex', alignItems: 'end', gap: 7, opacity: 0.48 }}>
            {[18, 34, 22, 48, 30, 58, 26, 42, 20, 52, 32, 62].map((height, index) => (
              <span key={index} style={{ width: 8, height: height * (0.72 + focus * 0.28), background: index < 6 ? C.indigo : C.cyan, transform: `skewY(${index % 2 ? -8 : 8}deg)` }} />
            ))}
          </div>
          <div style={{ position: 'absolute', left: 76, top: 178, width: 154, height: 2, background: 'rgba(216,229,255,0.28)' }}>
            <span style={{ position: 'absolute', left: `${Math.min(142, frame * 1.4)}px`, top: -6, width: 12, height: 12, background: C.rose, transform: 'rotate(45deg)' }} />
          </div>
          {copy.hookTeaser ? (
            <div style={{ position: 'absolute', right: 64, bottom: 92, width: 236, opacity: focus, transform: `translateY(${(1 - focus) * 18}px) rotate(-1.5deg)`, zIndex: 30 }}>
              <div style={{ position: 'absolute', right: -12, top: -16, zIndex: 2, padding: '5px 10px', background: C.amber, color: C.navy, fontFamily: MONO_STACK, fontSize: 11, fontWeight: 800, letterSpacing: 0.8, transform: 'rotate(4deg)', boxShadow: '0 8px 18px rgba(11,16,32,0.35)' }}>{copy.hookTeaser}</div>
              <div style={{ border: '2px solid #2A3A5F', background: C.navy2, boxShadow: '0 18px 40px rgba(0,0,0,0.42)' }}>
                <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', borderBottom: '1px solid #2A3A5F' }}>
                  {[C.rose, C.amber, C.green].map((color) => <span key={color} style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />)}
                  <span style={{ marginLeft: 8, fontFamily: MONO_STACK, fontSize: 10.5, color: '#8FA5C7' }}>{copy.playerFile ?? 'rag-explainer.mp4'}</span>
                </div>
                <div style={{ position: 'relative', height: 104, background: '#FBFCFE', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                  {[C.blue, C.indigo, C.amber, C.green].map((color, index) => (
                    <React.Fragment key={color}>
                      <span style={{ width: 25, height: 25, borderRadius: index === 0 || index === 3 ? '50%' : 5, background: color, opacity: 0.92, transform: `rotate(${index % 2 ? 2 : -2}deg)` }} />
                      {index < 3 ? <span style={{ width: 11, height: 2.5, background: '#98A2B3' }} /> : null}
                    </React.Fragment>
                  ))}
                  <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(11,16,32,0.72)', display: 'grid', placeItems: 'center' }}>
                    <span style={{ marginLeft: 3, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '11px solid #fff' }} />
                  </span>
                </div>
                <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px' }}>
                  <span style={{ flex: 1, height: 4, background: '#253451', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '68%', background: C.cyan }} />
                  </span>
                  <span style={{ fontFamily: MONO_STACK, fontSize: 10.5, color: '#8FA5C7' }}>0:09</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ position: 'absolute', right: 94, bottom: 118, display: 'flex', gap: 10, color: '#8FA5C7', fontFamily: MONO_STACK, fontSize: 13 }}>
              <span>00:00</span><span style={{ color: C.cyan }}>/</span><span>00:42</span>
            </div>
          )}
        </>
      ) : null}
      {fragments.map((item, index) => {
        const p = easeOut((frame - item.delay) / 22) * (1 - focus * 0.78);
        const float = Math.sin((frame + index * 13) / 15) * 8;
        return (
          <div key={item.label} style={{ position: 'absolute', left: item.x, top: item.y + float, width: 190, height: 88, opacity: p, border: `2px solid ${item.color}`, background: 'rgba(19,28,53,0.88)', display: 'grid', placeItems: 'center', color: item.color, fontFamily: MONO_STACK, fontSize: 22, fontWeight: 700, transform: `rotate(${index % 2 ? 4 : -4}deg)` }}>
            {item.label}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 130, right: 130, top: 214, textAlign: 'center', opacity: focus }}>
        <div style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 850 }}>{copy.hookTop}</div>
        <div style={{ marginTop: 20, fontSize: 72, lineHeight: 1.05, fontWeight: 850, color: C.cyan }}>{copy.hookBottom}</div>
      </div>
      <Rail>{copy.hookRail}</Rail>
    </DarkStage>
  );
}

function PromiseScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 168 / Math.max(1, duration);
  const iconP = easeOut(frame / 30);
  const nodes = [
    { label: copy.vocabulary[0], x: 142, y: 270, color: C.amber, start: 42 },
    { label: copy.vocabulary[1], x: 920, y: 210, color: C.green, start: 62 },
    { label: copy.vocabulary[2], x: 890, y: 430, color: C.rose, start: 82 },
  ];
  return (
    <DarkStage dense={enhanced}>
      {enhanced ? <SceneMeta index="02" label="THE SYSTEM" /> : null}
      <div style={{ position: 'absolute', left: 86, top: 116, ...reveal(frame, 8, 24) }}>
        <div style={{ fontSize: 58, maxWidth: 720, lineHeight: 1.06, fontWeight: 850 }}>{copy.promiseTitle}</div>
      </div>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {enhanced ? (
          <>
            <circle cx="640" cy="386" r="156" fill="none" stroke="rgba(94,231,255,0.22)" strokeWidth="2" strokeDasharray="6 12" transform={`rotate(${frame * 0.34} 640 386)`} />
            <circle cx="640" cy="386" r="194" fill="none" stroke="rgba(110,123,255,0.18)" strokeWidth="1.5" />
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const angle = frame * 0.012 + index * Math.PI / 3;
              return <circle key={index} cx={640 + Math.cos(angle) * 194} cy={386 + Math.sin(angle) * 194} r={index % 2 ? 5 : 8} fill={index % 3 === 0 ? C.cyan : index % 3 === 1 ? C.indigo : C.green} opacity="0.72" />;
            })}
          </>
        ) : null}
        {nodes.map((node) => {
          const p = easeOut((frame - node.start) / 26);
          return <line key={node.label} x1={640} y1={386} x2={node.x + 106} y2={node.y + 38} stroke={node.color} strokeWidth={3} strokeDasharray="10 10" opacity={0.56 * p} />;
        })}
      </svg>
      <img src={seqvioIcon} alt="" style={{ position: 'absolute', left: 522, top: 270, width: 236, height: 236, opacity: iconP, transform: `scale(${0.78 + iconP * 0.22}) rotate(${(1 - iconP) * -8}deg)` }} />
      {enhanced ? (
        <>
          <div style={{ position: 'absolute', left: 548, top: 242, color: '#91A4C4', fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 1.4 }}>AGENT INPUT</div>
          <div style={{ position: 'absolute', left: 750, top: 500, color: C.cyan, fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 1.4 }}>VISUAL OUTPUT</div>
        </>
      ) : null}
      {nodes.map((node) => (
        <div key={node.label} style={{ position: 'absolute', left: node.x, top: node.y, width: 212, height: 76, display: 'grid', placeItems: 'center', border: `2px solid ${node.color}`, background: 'rgba(11,16,32,0.92)', color: node.color, fontFamily: MONO_STACK, fontSize: 20, fontWeight: 700, ...reveal(frame, node.start, 24, 12) }}>
          {node.label}
        </div>
      ))}
      <Rail>{copy.promiseRail}</Rail>
    </DarkStage>
  );
}

function TerminalWindow({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: 76, top: 152, width: 710, height: 414, background: '#080D19', border: '2px solid #263556', boxShadow: '0 24px 56px rgba(11,16,32,0.25)', overflow: 'hidden' }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 9, padding: '0 16px', borderBottom: '1px solid #263556', background: '#10182B' }}>
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
      {enhanced ? <SceneMeta index="03" label="REAL AGENT TASK" light /> : null}
      <div style={{ position: 'absolute', left: 76, top: 102, fontSize: 18, color: C.muted, fontFamily: MONO_STACK }}>{copy.promptLabel}</div>
      <TerminalWindow>
        <div style={{ padding: 30, fontFamily: MONO_STACK, color: '#D8E5FF' }}>
          <div style={{ fontSize: 18, color: C.green, ...reveal(frame, 8, 18) }}>$ codex</div>
          <div style={{ marginTop: 24, fontSize: 27, lineHeight: 1.48, ...reveal(frame, 28, 26) }}><span style={{ color: C.cyan }}>&gt; </span>{copy.promptText}</div>
          <div style={{ marginTop: 30, fontSize: 17, color: '#8FA5C7', ...reveal(frame, 78, 22) }}>/seqvio&nbsp;&nbsp;planning explainer structure...</div>
          <div style={{ marginTop: 18, height: 8, background: '#1D2942', ...reveal(frame, 100, 16) }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (frame - 100) * 1.6))}%`, height: '100%', background: C.blue }} />
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
      <div style={{ position: 'absolute', left: 842, top: 160, width: 348 }}>
        {copy.files.map((file, index) => (
          <div key={file} style={{ height: 96, marginBottom: 22, padding: '18px 20px', border: `2px solid ${index === 0 ? C.blue : index === 1 ? C.indigo : C.green}`, background: C.white, boxShadow: '0 14px 30px rgba(16,24,40,0.10)', fontFamily: MONO_STACK, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', ...reveal(frame, 104 + index * 28, 22, 18) }}>
            <span style={{ width: 34, height: 34, marginRight: 14, display: 'grid', placeItems: 'center', color: C.white, background: index === 0 ? C.blue : index === 1 ? C.indigo : C.green, fontSize: 13 }}>{String(index + 1).padStart(2, '0')}</span>{file}
          </div>
        ))}
      </div>
      {enhanced ? (
        <div style={{ position: 'absolute', left: 842, top: 524, width: 348, display: 'flex', justifyContent: 'space-between', fontFamily: MONO_STACK, fontSize: 12, color: C.muted, ...reveal(frame, 176, 20, 8) }}>
          <span>PLAN</span><span style={{ color: C.blue }}>●</span><span>AUTHOR</span><span style={{ color: C.indigo }}>●</span><span>ALIGN</span><span style={{ color: C.green }}>●</span><span>RENDER</span>
        </div>
      ) : null}
      <Rail light>{copy.promptRail}</Rail>
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
  const boardScale = 1 - pull * 0.26;
  const boardW = W * boardScale;
  const boardH = H * boardScale;
  const boardX = (W - boardW) / 2;
  const boardY = (H - boardH) / 2;
  const clipNow = Math.min(9, Math.floor(Math.min(1, frame / drawDuration) * 9));
  const actionLabels = copy.lang === 'zh'
    ? ['观察', '追踪', '诊断', '验证']
    : ['OBSERVE', 'TRACE', 'DIAGNOSE', 'VERIFY'];
  const icons = ['lightbulb', 'plus', 'document', 'check'];
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
          text={copy.ragRail}
          position={{ x: 640, y: 546 }}
          align="center"
          fontSize={31}
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
            border: '3px solid #263556',
            boxShadow: '0 24px 48px rgba(16,24,40,0.28)',
          }}
        >
          <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#10182B', borderBottom: '3px solid #263556' }}>
            {[C.rose, C.amber, C.green].map((color) => <span key={color} style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />)}
            <span style={{ marginLeft: 10, fontFamily: MONO_STACK, fontSize: 14, color: '#8FA5C7' }}>{copy.playerFile ?? 'rag-explainer.mp4'}</span>
            <span style={{ marginLeft: 'auto', padding: '3px 8px', border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: MONO_STACK, fontSize: 11, fontWeight: 700 }}>1080p</span>
          </div>
          <div style={{ height: boardH - 6 }} />
          <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: '#10182B', borderTop: '3px solid #263556' }}>
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
            top: boardY - 74,
            zIndex: 30,
            padding: '10px 16px',
            background: C.green,
            color: C.navy,
            fontFamily: MONO_STACK,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 0.6,
            whiteSpace: 'nowrap',
            transform: `rotate(-4deg) translateY(${(1 - badgeP) * 14}px)`,
            opacity: badgeP,
            boxShadow: '0 14px 30px rgba(16,24,40,0.3)',
          }}
        >
          ● {copy.outputBadge}
        </div>
      ) : null}
      <BrandBug light />
      {enhanced ? <SceneMeta index="04" label="VISUAL EXPLANATION" light /> : null}
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

function MiniProductDemo() {
  return (
    <ProductDemoScene width={344} height={330} background="#EEF2F6">
      <BrowserFrame
        position={{ x: 18, y: 38 }}
        width={308}
        height={248}
        url="ci-run.local"
        title="captured evidence"
        start={18}
        duration={22}
      >
        <div style={{ padding: 18, fontFamily: UI_STACK }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>
            Native module load
          </div>
          <div style={{ marginTop: 16, height: 10, width: 230, background: '#DCE5F3' }} />
          <div style={{ marginTop: 9, height: 10, width: 186, background: '#DCE5F3' }} />
          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            {['BUILD', 'PTY', 'OK'].map((item, index) => (
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
  const cards = [
    { label: copy.styleLabels[0], child: <MiniWhiteboard copy={copy} />, color: C.blue, width: 370, offset: 0, mark: '01' },
    { label: copy.styleLabels[1], child: <MiniScatter copy={copy} />, color: C.amber, width: 340, offset: 26, mark: '02' },
    { label: copy.styleLabels[2], child: <MiniProductDemo />, color: C.green, width: 370, offset: 0, mark: '03' },
  ];
  return (
    <LightStage dense={enhanced}>
      {enhanced ? <SceneMeta index="05" label="EXPLANATION CONTRACT" light /> : null}
      <div
        style={{
          position: 'absolute',
          left: 74,
          top: 102,
          fontSize: enhanced ? 42 : 50,
          fontWeight: 850,
          ...reveal(frame, 4, 22),
        }}
      >
        {copy.stylesTitle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 74,
          right: 74,
          top: 186,
          display: 'flex',
          gap: 28,
        }}
      >
        {cards.map((card, index) => (
          <div
            key={card.label}
            style={{
              position: 'relative',
              width: card.width,
              marginTop: enhanced ? card.offset : 0,
              ...reveal(frame, 34 + index * 52, 26, 28),
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                background: C.white,
                border: `3px solid ${card.color}`,
                boxShadow: '0 18px 40px rgba(16,24,40,0.12)',
                overflow: 'hidden',
              }}
            >
              {enhanced ? <div style={{ height: 8, background: card.color }} /> : null}
              <div style={{ height: 330, display: 'grid', placeItems: 'center' }}>{card.child}</div>
              <div
                style={{
                  height: 58,
                  display: 'grid',
                  placeItems: 'center',
                  borderTop: `2px solid ${enhanced ? card.color : '#EEF2F6'}`,
                  fontFamily: MONO_STACK,
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.ink,
                }}
              >
                {card.label}
              </div>
            </div>
            {enhanced ? (
              <span style={{ position: 'absolute', right: -10, top: -18, width: 48, height: 48, display: 'grid', placeItems: 'center', color: C.white, background: card.color, fontFamily: MONO_STACK, fontSize: 15, fontWeight: 800, transform: `rotate(${index === 1 ? 7 : -7}deg)`, boxShadow: '0 10px 22px rgba(16,24,40,0.16)' }}>{card.mark}</span>
            ) : null}
          </div>
        ))}
      </div>
      <Rail light>{copy.stylesRail}</Rail>
    </LightStage>
  );
}

function ProofScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 246 / Math.max(1, duration);
  const commands = [
    'seqvio-generate validate --ir explainer.json --ir-format explainer',
    'seqvio-audio synthesize --manifest audio.json',
    'seqvio-qa --frames 0,120,240',
    'seqvio-render --component rag-explainer.tsx',
  ];
  return (
    <DarkStage dense={enhanced}>
      {enhanced ? <SceneMeta index="06" label="WORKFLOW PROOF" /> : null}
      <div
        style={{
          position: 'absolute',
          left: 78,
          top: 104,
          fontSize: 50,
          fontWeight: 850,
          ...reveal(frame, 4, 22),
        }}
      >
        {copy.proofTitle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 182,
          width: 718,
          height: 392,
          background: '#070B13',
          border: '2px solid #2A3A5F',
        }}
      >
        <div
          style={{
            height: 42,
            padding: '11px 16px',
            color: '#8FA5C7',
            fontFamily: MONO_STACK,
            fontSize: 15,
            borderBottom: '1px solid #2A3A5F',
          }}
        >
          real Seqvio CLI
          {enhanced ? <span style={{ float: 'right', color: C.green }}>RUN 04/04</span> : null}
        </div>
        <div style={{ position: 'relative', padding: 24, fontFamily: MONO_STACK }}>
          {enhanced ? <div style={{ position: 'absolute', left: 34, top: 30, bottom: 38, width: 2, background: 'linear-gradient(180deg, #38B6FF, #6E7BFF, #F4B740, #32D583)' }} /> : null}
          {commands.map((command, index) => (
            <div
              key={command}
              style={{
                position: 'relative',
                paddingLeft: enhanced ? 30 : 0,
                marginBottom: copy.proofOutputs ? 19 : 25,
                fontSize: 17,
                color: '#D8E5FF',
                ...reveal(frame, 28 + index * 42, 20, 10),
              }}
            >
              {enhanced ? <span style={{ position: 'absolute', left: -2, top: 1, width: 20, height: 20, display: 'grid', placeItems: 'center', borderRadius: '50%', color: C.navy, background: [C.blue, C.indigo, C.amber, C.green][index], fontSize: 11, fontWeight: 900 }}>{index + 1}</span> : null}
              <span style={{ color: C.green }}>$ </span>
              {command}
              <span style={{ marginLeft: 14, color: C.green }}>✓</span>
              {copy.proofOutputs ? (
                <div style={{ marginTop: 7, fontSize: 13.5, color: '#7E93BC' }}>{copy.proofOutputs[index]}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 840, top: 184, width: 350 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                height: 126,
                padding: 14,
                border: `2px solid ${[C.blue, C.indigo, C.amber, C.green][index]}`,
                background: C.navy2,
                ...reveal(frame, 64 + index * 34, 20, 14),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ height: 10, width: `${56 + index * 8}%`, background: [C.blue, C.indigo, C.amber, C.green][index] }} />
                {enhanced ? <span style={{ width: 22, height: 22, display: 'grid', placeItems: 'center', border: `2px solid ${[C.blue, C.indigo, C.amber, C.green][index]}`, borderRadius: '50%', color: [C.blue, C.indigo, C.amber, C.green][index], fontSize: 13, fontWeight: 900 }}>✓</span> : null}
              </div>
              <div style={{ marginTop: 16, height: 46, border: '1px solid #35476D', display: 'flex', alignItems: 'end', gap: 5, padding: '8px 9px' }}>
                {enhanced ? [22, 34, 18, 40, 28, 38].map((height, barIndex) => <span key={barIndex} style={{ width: 8, height: height * 0.7, background: [C.blue, C.indigo, C.amber, C.green][index], opacity: 0.48 + barIndex * 0.07 }} />) : null}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: MONO_STACK,
                  color: '#AFC2E2',
                  fontSize: 13,
                }}
              >
                {copy.checks[index]}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 18,
            padding: 16,
            border: `2px solid ${C.green}`,
            color: C.green,
            fontFamily: MONO_STACK,
            fontSize: 18,
            textAlign: 'center',
            ...reveal(frame, 198, 22),
          }}
        >
          {enhanced ? <span style={{ display: 'inline-block', marginRight: 12, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: `12px solid ${C.green}` }} /> : null}
          output/seqvio-rag.mp4
          {copy.proofOutputs ? (
            <div style={{ marginTop: 8, fontSize: 12.5, color: '#7E93BC', fontWeight: 400 }}>1920×1080 · 0:09 · H.264</div>
          ) : null}
        </div>
      </div>
      {enhanced ? (
        <div style={{ position: 'absolute', left: 76, top: 590, width: 1114, height: 12, display: 'flex', gap: 4, opacity: 0.52 }}>
          {Array.from({ length: 32 }).map((_, index) => <span key={index} style={{ flex: 1, background: index < Math.min(32, Math.max(0, Math.round((frame - 18) / 6))) ? (index < 9 ? C.blue : index < 17 ? C.indigo : index < 25 ? C.amber : C.green) : '#253451' }} />)}
        </div>
      ) : null}
      <Rail>{copy.proofRail}</Rail>
    </DarkStage>
  );
}

function ClosingScene({ copy, duration, enhanced }: { copy: OverviewCopy; duration: number; enhanced: boolean }) {
  const frame = useCurrentFrame() * 228 / Math.max(1, duration);
  const p = easeOut((frame - 18) / 30);
  return (
    <DarkStage>
      {enhanced ? <SceneMeta index="07" label="SEQVIO" /> : null}
      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 154,
          width: 740,
          ...reveal(frame, 8, 26),
        }}
      >
        <div
          style={{
            fontFamily: MONO_STACK,
            color: C.cyan,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {copy.closeKicker}
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 72,
            lineHeight: 1.04,
            fontWeight: 880,
          }}
        >
          {copy.closeTitle}
        </div>
        <div
          style={{
            marginTop: 30,
            color: '#B8C7E3',
            fontSize: 25,
            lineHeight: 1.4,
          }}
        >
          {copy.closeRail}
        </div>
        <div
          style={{
            marginTop: 34,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 20px',
            border: `2px solid ${C.cyan}`,
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
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              ...reveal(frame, 102, 24),
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: '#10182B', border: '2px solid #2A3A5F', color: '#D8E5FF', fontFamily: MONO_STACK, fontSize: 16 }}>
              <span style={{ color: C.green }}>$</span>
              {copy.ctaInstall}
            </div>
            {copy.ctaStar ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 16px', border: `2px solid ${C.amber}`, color: C.amber, fontFamily: MONO_STACK, fontSize: 16, fontWeight: 700 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>★</span>
                {copy.ctaStar}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 92,
          top: 166,
          width: 310,
          height: 310,
          transform: `scale(${0.82 + p * 0.18}) rotate(${(1 - p) * 9}deg)`,
          opacity: p,
        }}
      >
        {enhanced ? (
          <svg width="310" height="310" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
              const angle = index * Math.PI / 4 + frame * 0.006;
              return <line key={index} x1={155 + Math.cos(angle) * 176} y1={155 + Math.sin(angle) * 176} x2={155 + Math.cos(angle) * 204} y2={155 + Math.sin(angle) * 204} stroke={index % 2 ? C.indigo : C.cyan} strokeWidth={index % 3 === 0 ? 4 : 2} opacity="0.52" />;
            })}
          </svg>
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: -30,
            border: '2px solid rgba(94,231,255,0.28)',
            borderRadius: '50%',
            transform: `rotate(${frame * 0.32}deg)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: -62,
            border: '1px dashed rgba(110,123,255,0.38)',
            borderRadius: '50%',
            transform: `rotate(${-frame * 0.22}deg)`,
          }}
        />
        <img src={seqvioIcon} alt="" style={{ width: '100%', height: '100%' }} />
      </div>
      {enhanced && !copy.ctaInstall ? (
        <div style={{ position: 'absolute', left: 76, top: 548, display: 'flex', gap: 12, ...reveal(frame, 104, 24, 10) }}>
          {copy.styleLabels.map((label, index) => (
            <span key={label} style={{ minWidth: 178, padding: '10px 14px', border: `2px solid ${[C.blue, C.amber, C.green][index]}`, color: [C.blue, C.amber, C.green][index], background: 'rgba(11,16,32,0.72)', fontFamily: MONO_STACK, fontSize: 13, fontWeight: 800, textAlign: 'center' }}>{label}</span>
          ))}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 76,
          right: 76,
          bottom: 46,
          height: 2,
          background: 'linear-gradient(90deg, #5EE7FF, #6E7BFF, #32D583)',
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
        <ScaledOverviewStage scale={scale}><PromiseScene copy={copy} duration={promise} enhanced={enhanced} /></ScaledOverviewStage>
      </Scene>
      <Scene id="prompt" duration={prompt}>
        <ScaledOverviewStage scale={scale}><PromptScene copy={copy} duration={prompt} enhanced={enhanced} /></ScaledOverviewStage>
      </Scene>
      <Scene id="explanation" duration={explanation}>
        <ScaledOverviewStage scale={scale}><RagExplanationScene copy={copy} duration={explanation} enhanced={enhanced} /></ScaledOverviewStage>
      </Scene>
      <Scene id="styles" duration={styles}>
        <ScaledOverviewStage scale={scale}><StylesScene copy={copy} duration={styles} enhanced={enhanced} /></ScaledOverviewStage>
      </Scene>
      <Scene id="proof" duration={proof}>
        <ScaledOverviewStage scale={scale}><ProofScene copy={copy} duration={proof} enhanced={enhanced} /></ScaledOverviewStage>
      </Scene>
      <Scene id="closing" duration={closing}>
        <ScaledOverviewStage scale={scale}><ClosingScene copy={copy} duration={closing} enhanced={enhanced} /></ScaledOverviewStage>
      </Scene>
    </VideoComposition>
  );
}
