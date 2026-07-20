/**
 * Agent-facing contracts for producing Seqvio IR.
 *
 * Seqvio writes these prompts for a host agent, then validates and compiles the
 * returned JSON deterministically. This file does not call AI or the network.
 */

export type AgentLanguage = 'zh' | 'en' | 'auto';
export type AgentDomain =
  | 'history'
  | 'science'
  | 'programming'
  | 'ai'
  | 'devops'
  | 'auto';
export type AgentIrFormat = 'storyboard-v1' | 'composition-v2' | 'auto';

export interface AgentPlanningOptions {
  language?: AgentLanguage;
  maxScenes?: number;
  domain?: AgentDomain;
  /** IR format. auto: technical domains → composition-v2, else storyboard-v1. */
  irFormat?: AgentIrFormat;
}

export const STORYBOARD_AGENT_SYSTEM_PROMPT = `You are a Seqvio storyboard agent.
In a single response, convert the user's content into a complete JSON storyboard IR for whiteboard explainer videos.
Do not call external APIs or defer planning to another step.

Rules:
- Output ONLY valid JSON. No markdown fences, no commentary.
- Use style "whiteboard" or omit style.
- 3 to 6 scenes. Each scene needs id, narration, duration, and elements.
- Use ASCII scene ids: intro, context, process, example, summary.
- elements must be an array of whiteboard drawables.
- Supported element types: text, shape, image, icon.
- narration must be full spoken sentences, never just the title alone.
- Timing is in frames. Element start/duration values are local to each scene.
- Use explicit coordinates. Keep text inside a 1280x720 frame unless width/height say otherwise.
- Use arrows, underlines, simple shapes, and short labels for visual explanation.
- Do not use visual/layout fields; Seqvio currently compiles Storyboard IR to whiteboard TSX only.

Minimal example:
{
  "id": "topic-slug",
  "style": "whiteboard",
  "fps": 30,
  "width": 1280,
  "height": 720,
  "lockToAudio": true,
  "transitionDuration": 12,
  "scenes": [
    {
      "id": "intro",
      "duration": 120,
      "narration": "...",
      "elements": [
        {
          "type": "text",
          "text": "...",
          "position": { "x": 640, "y": 180 },
          "fontSize": 48,
          "align": "center",
          "start": 0,
          "duration": 30
        }
      ]
    }
  ]
}`;

export const COMPOSITION_V2_AGENT_SYSTEM_PROMPT = `You are a Seqvio CompositionDocument v2 agent for technical explainers.
In a single response, convert the user's content into one CompositionDocument JSON.
Do not call external APIs or defer planning to another step.

Rules:
- Output ONLY valid JSON. No markdown fences, no commentary.
- Set "version": "2.0".
- Prefer 4 to 9 scenes. Mix whiteboard, code, and diagram scenes when useful.
- Every scene needs a unique ASCII id. Every diagram node/edge/panel needs a unique id across the whole document.
- Use chapters when the video is longer than ~90 seconds.
- narration must be full spoken sentences.
- Timing is in frames at fps 30 unless specified.
- Prefer semantic actions over pixel coordinates for code and diagram scenes.
- Annotations must use targetId referencing an existing scene/node/edge id.

Scene types:
- whiteboard: elements = text | shape | image | icon (same as Storyboard v1)
- code: language, source, steps (type | focus | insert | replace | delete | annotate)
- diagram: nodes, edges, steps (reveal | connect | trace | emphasize)

Minimal example:
{
  "version": "2.0",
  "id": "api-request-explainer",
  "width": 1280,
  "height": 720,
  "fps": 30,
  "lockToAudio": true,
  "transitionDuration": 12,
  "chapters": [
    { "id": "intro", "sceneIds": ["hook"] },
    { "id": "deep-dive", "sceneIds": ["code-step", "architecture"] }
  ],
  "scenes": [
    {
      "type": "whiteboard",
      "id": "hook",
      "duration": 180,
      "narration": "Today we trace one request through the system.",
      "elements": [
        {
          "type": "text",
          "text": "Request trace",
          "position": { "x": 640, "y": 280 },
          "fontSize": 48,
          "align": "center",
          "start": 0,
          "duration": 30
        }
      ]
    },
    {
      "type": "code",
      "id": "code-step",
      "duration": 240,
      "language": "typescript",
      "source": "async function fetchUser(id: string) {\\n  return api.get(\`/users/\${id}\`);\\n}\\n",
      "steps": [
        { "at": 0, "action": "focus", "range": { "startLine": 1, "endLine": 3 } },
        { "at": 30, "action": "type", "range": { "startLine": 2, "endLine": 2 } }
      ],
      "narration": "The client uses one typed helper for the request."
    },
    {
      "type": "diagram",
      "id": "architecture",
      "duration": 300,
      "nodes": [
        { "id": "client", "label": "Client" },
        { "id": "api", "label": "API" }
      ],
      "edges": [{ "id": "req", "from": "client", "to": "api", "label": "HTTPS" }],
      "steps": [
        { "at": 0, "action": "reveal", "targetId": "client" },
        { "at": 24, "action": "reveal", "targetId": "api" },
        { "at": 48, "action": "connect", "edgeId": "req" }
      ],
      "narration": "The request crosses the API boundary."
    }
  ]
}`;

export const STORYBOARD_AGENT_JSON_SCHEMA = {
  type: 'object',
  required: ['id', 'scenes'],
  properties: {
    id: { type: 'string' },
    style: { enum: ['whiteboard'] },
    fps: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
    lockToAudio: { type: 'boolean' },
    transitionDuration: { type: 'number' },
    scenes: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'elements'],
        properties: {
          id: { type: 'string' },
          narration: { type: 'string' },
          duration: { type: 'number' },
          elements: { type: 'array' },
        },
      },
    },
  },
} as const;

export function resolveAgentIrFormat(
  options: AgentPlanningOptions = {}
): 'storyboard-v1' | 'composition-v2' {
  if (options.irFormat === 'storyboard-v1' || options.irFormat === 'composition-v2') {
    return options.irFormat;
  }
  const domain = options.domain ?? 'auto';
  if (domain === 'programming' || domain === 'ai' || domain === 'devops') {
    return 'composition-v2';
  }
  return 'storyboard-v1';
}

function describeDomain(domain: AgentDomain | undefined): string {
  switch (domain) {
    case 'history':
      return 'History explainer.';
    case 'science':
      return 'Popular science explainer.';
    case 'programming':
      return 'Programming / software-engineering technical explainer.';
    case 'ai':
      return 'AI / ML systems technical explainer.';
    case 'devops':
      return 'DevOps / infrastructure technical explainer.';
    default:
      return 'Infer the content domain.';
  }
}

export function formatAgentPlanningPrompt(
  content: string,
  options: AgentPlanningOptions = {}
): string {
  const language =
    options.language === 'zh'
      ? 'Write narration in Chinese.'
      : options.language === 'en'
        ? 'Write narration in English.'
        : 'Match the language of the source content.';

  const irFormat = resolveAgentIrFormat(options);
  const systemPrompt =
    irFormat === 'composition-v2'
      ? COMPOSITION_V2_AGENT_SYSTEM_PROMPT
      : STORYBOARD_AGENT_SYSTEM_PROMPT;
  const formatLabel =
    irFormat === 'composition-v2'
      ? 'CompositionDocument v2 JSON (version "2.0")'
      : 'whiteboard Storyboard IR JSON';

  return `# Seqvio Agent Planning Task

Use this single agent turn to produce the complete ${formatLabel}.
Seqvio itself will only validate and compile the JSON; all creative planning happens here.

## System

${systemPrompt}

## User

Plan a complete ${irFormat === 'composition-v2' ? 'technical composition' : 'whiteboard storyboard'} for the content below.
${language}
${describeDomain(options.domain)}
Target ${options.maxScenes ?? 5} scenes.
IR format: ${irFormat}.

Return ONLY the JSON object.

Content:
${content}
`;
}
