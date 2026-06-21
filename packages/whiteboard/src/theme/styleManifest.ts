import {
  defaultWhiteboardTheme,
  type WhiteboardTheme,
} from './defaultTheme';
import { fieldNotePalette, fieldNoteTheme } from './fieldNoteTheme';
import { pinAndPaperTheme, pinPalette } from './pinAndPaperTheme';
import { studioPalette, studioTheme } from './studioTheme';

export type SeqvioStyleDensity = 'low' | 'medium' | 'high';
export type SeqvioStyleScheme = 'light' | 'dark' | 'mixed';
export type SeqvioStyleFormality = 'low' | 'medium' | 'high';

export interface SeqvioStylePreset {
  id: string;
  name: string;
  packageName: '@seqvio/whiteboard';
  themeExport: string;
  tagline: string;
  mood: string[];
  occasion: string[];
  tone: string[];
  density: SeqvioStyleDensity;
  scheme: SeqvioStyleScheme;
  formality: SeqvioStyleFormality;
  bestFor: string;
  avoidFor: string;
  background: string;
  texture: 'paper' | 'whiteboard' | 'chalkboard' | 'none';
  colors: {
    ink: string;
    accent: string;
    accent2: string;
    surface: string;
  };
  typeScale: WhiteboardTheme['typeScale'];
  spacing: WhiteboardTheme['spacing'];
  theme: Partial<WhiteboardTheme>;
}

export const seqvioStylePresets = [
  {
    id: 'whiteboard/default',
    name: 'Clean Whiteboard',
    packageName: '@seqvio/whiteboard',
    themeExport: 'defaultWhiteboardTheme',
    tagline: 'A clear stroke-first whiteboard style for lessons and product explainers.',
    mood: ['clear', 'instructional', 'calm', 'approachable'],
    occasion: ['lesson explainer', 'technical walkthrough', 'onboarding', 'process demo'],
    tone: ['plainspoken', 'useful', 'friendly'],
    density: 'medium',
    scheme: 'light',
    formality: 'medium',
    bestFor:
      'Default education and product communication where clarity matters more than visual drama.',
    avoidFor:
      'Brand-led videos that need a distinctive editorial or high-contrast art direction.',
    background: defaultWhiteboardTheme.colors.background,
    texture: 'whiteboard',
    colors: {
      ink: defaultWhiteboardTheme.colors.ink,
      accent: defaultWhiteboardTheme.colors.accent,
      accent2: defaultWhiteboardTheme.colors.accent2,
      surface: defaultWhiteboardTheme.colors.surface,
    },
    typeScale: defaultWhiteboardTheme.typeScale,
    spacing: defaultWhiteboardTheme.spacing,
    theme: defaultWhiteboardTheme,
  },
  {
    id: 'whiteboard/field-note',
    name: 'Field Note',
    packageName: '@seqvio/whiteboard',
    themeExport: 'fieldNoteTheme',
    tagline: 'Yellow paper and cobalt ink with a printed notebook feel.',
    mood: ['tactile', 'editorial', 'warm', 'crafted'],
    occasion: ['research recap', 'workshop debrief', 'concept lesson', 'qualitative findings'],
    tone: ['thoughtful', 'grounded', 'human'],
    density: 'medium',
    scheme: 'light',
    formality: 'medium',
    bestFor:
      'Explainers that should feel like organized field notes rather than polished corporate slides.',
    avoidFor:
      'Videos that require a neutral white canvas, minimal color, or strict institutional restraint.',
    background: fieldNotePalette.paper,
    texture: 'none',
    colors: {
      ink: fieldNotePalette.ink,
      accent: fieldNotePalette.red,
      accent2: fieldNotePalette.olive,
      surface: fieldNotePalette.cream,
    },
    typeScale: fieldNoteTheme.typeScale!,
    spacing: fieldNoteTheme.spacing!,
    theme: fieldNoteTheme,
  },
  {
    id: 'whiteboard/pin-and-paper',
    name: 'Pin & Paper',
    packageName: '@seqvio/whiteboard',
    themeExport: 'pinAndPaperTheme',
    tagline: 'Hand-drawn yellow notebook energy for warm, workshop-like stories.',
    mood: ['handmade', 'playful', 'warm', 'workshop'],
    occasion: ['brainstorm recap', 'creator explainer', 'team kickoff', 'idea sketch'],
    tone: ['informal', 'expressive', 'encouraging'],
    density: 'medium',
    scheme: 'light',
    formality: 'low',
    bestFor:
      'Scenes that should feel personal, exploratory, and visibly hand-made.',
    avoidFor:
      'Precise data-heavy videos where handwriting would reduce authority or legibility.',
    background: pinPalette.paper,
    texture: 'none',
    colors: {
      ink: pinPalette.ink,
      accent: pinPalette.red,
      accent2: pinPalette.olive,
      surface: pinPalette.cream,
    },
    typeScale: pinAndPaperTheme.typeScale!,
    spacing: pinAndPaperTheme.spacing!,
    theme: pinAndPaperTheme,
  },
  {
    id: 'whiteboard/studio',
    name: 'Studio',
    packageName: '@seqvio/whiteboard',
    themeExport: 'studioTheme',
    tagline: 'Near-black and acid yellow: typography as the visual system.',
    mood: ['bold', 'graphic', 'high-contrast', 'design-led'],
    occasion: ['product launch', 'brand statement', 'conference opener', 'creative demo'],
    tone: ['confident', 'direct', 'electric'],
    density: 'low',
    scheme: 'dark',
    formality: 'medium',
    bestFor:
      'Short opener and punchline scenes where the title itself should carry the composition.',
    avoidFor:
      'Long reading-first explainers or scenes that need many soft secondary colors.',
    background: studioPalette.dark,
    texture: 'none',
    colors: {
      ink: studioPalette.yellow,
      accent: studioPalette.yellow,
      accent2: studioPalette.yellow,
      surface: studioPalette.darkAlt,
    },
    typeScale: studioTheme.typeScale!,
    spacing: studioTheme.spacing!,
    theme: studioTheme,
  },
] as const satisfies readonly SeqvioStylePreset[];

export type SeqvioStyleId = (typeof seqvioStylePresets)[number]['id'];

export function getSeqvioStylePreset(id: string): SeqvioStylePreset | undefined {
  return seqvioStylePresets.find((preset) => preset.id === id);
}

export function listSeqvioStylePresets(): readonly SeqvioStylePreset[] {
  return seqvioStylePresets;
}
