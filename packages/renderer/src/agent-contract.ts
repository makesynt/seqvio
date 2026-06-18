/**
 * Agent-facing contract for producing whiteboard Storyboard IR.
 *
 * Seqvio writes this prompt for a host agent, then validates and compiles the
 * returned JSON deterministically. This file does not call AI or the network.
 */

export interface AgentPlanningOptions {
  language?: 'zh' | 'en' | 'auto';
  maxScenes?: number;
  domain?: 'history' | 'science' | 'auto';
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

  const domain =
    options.domain === 'history'
      ? 'History explainer.'
      : options.domain === 'science'
        ? 'Popular science explainer.'
        : 'Infer the content domain.';

  return `# Seqvio Agent Planning Task

Use this single agent turn to produce the complete whiteboard Storyboard IR JSON.
Seqvio itself will only validate and compile the JSON; all creative planning happens here.

## System

${STORYBOARD_AGENT_SYSTEM_PROMPT}

## User

Plan a complete whiteboard storyboard for the content below.
${language}
${domain}
Target ${options.maxScenes ?? 5} scenes.

Return ONLY the storyboard JSON object.

Content:
${content}
`;
}
