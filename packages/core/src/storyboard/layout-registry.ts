export type StoryboardSceneRole =
  | 'hook'
  | 'context'
  | 'core'
  | 'shift'
  | 'takeaway';

export type StoryboardDensity = 'speaker-led' | 'reading-first';

export type StoryboardLayoutId =
  | 'title-card'
  | 'stat-hero'
  | 'process-flow'
  | 'before-after'
  | 'quote-focus'
  | 'summary-takeaway';

export interface StoryboardLayoutDefinition {
  id: StoryboardLayoutId;
  name: string;
  sceneRoles: StoryboardSceneRole[];
  density: StoryboardDensity[];
  recommendedDurationFrames: [number, number];
  minReadableFontSize: number;
  maxPrimaryTextChars: number;
  description: string;
}

export const STORYBOARD_LAYOUTS = [
  {
    id: 'title-card',
    name: 'Title Card',
    sceneRoles: ['hook', 'context'],
    density: ['speaker-led'],
    recommendedDurationFrames: [90, 180],
    minReadableFontSize: 28,
    maxPrimaryTextChars: 90,
    description: 'Opening or section title with one primary idea.',
  },
  {
    id: 'stat-hero',
    name: 'Stat Hero',
    sceneRoles: ['hook', 'core', 'shift'],
    density: ['speaker-led', 'reading-first'],
    recommendedDurationFrames: [120, 210],
    minReadableFontSize: 24,
    maxPrimaryTextChars: 120,
    description: 'Large number or compact data claim supported by one caption.',
  },
  {
    id: 'process-flow',
    name: 'Process Flow',
    sceneRoles: ['context', 'core'],
    density: ['reading-first'],
    recommendedDurationFrames: [150, 260],
    minReadableFontSize: 22,
    maxPrimaryTextChars: 220,
    description: 'Three to five connected steps, usually left-to-right.',
  },
  {
    id: 'before-after',
    name: 'Before / After',
    sceneRoles: ['core', 'shift'],
    density: ['speaker-led', 'reading-first'],
    recommendedDurationFrames: [130, 240],
    minReadableFontSize: 22,
    maxPrimaryTextChars: 180,
    description: 'Two-panel comparison for old/new, problem/solution, or tradeoff.',
  },
  {
    id: 'quote-focus',
    name: 'Quote Focus',
    sceneRoles: ['shift', 'takeaway'],
    density: ['speaker-led'],
    recommendedDurationFrames: [100, 190],
    minReadableFontSize: 28,
    maxPrimaryTextChars: 150,
    description: 'A memorable statement with minimal supporting text.',
  },
  {
    id: 'summary-takeaway',
    name: 'Summary Takeaway',
    sceneRoles: ['takeaway'],
    density: ['speaker-led', 'reading-first'],
    recommendedDurationFrames: [120, 220],
    minReadableFontSize: 24,
    maxPrimaryTextChars: 200,
    description: 'Closing summary with one to three concrete takeaways.',
  },
] as const satisfies readonly StoryboardLayoutDefinition[];

export const STORYBOARD_LAYOUT_IDS = STORYBOARD_LAYOUTS.map((layout) => layout.id);
export const STORYBOARD_SCENE_ROLES: StoryboardSceneRole[] = [
  'hook',
  'context',
  'core',
  'shift',
  'takeaway',
];
export const STORYBOARD_DENSITIES: StoryboardDensity[] = [
  'speaker-led',
  'reading-first',
];

export function getStoryboardLayout(
  id: string | undefined
): StoryboardLayoutDefinition | undefined {
  if (!id) return undefined;
  return STORYBOARD_LAYOUTS.find((layout) => layout.id === id);
}

