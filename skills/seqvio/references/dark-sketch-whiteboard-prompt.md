# Dark Sketch Whiteboard Prompt Template

Use this template when asking Seqvio to create a video similar to the Loop
Engineering explainer: a dark Excalidraw-like whiteboard video with hand-drawn
system diagrams and calm technical narration.

## General Template

```text
Please create a Chinese technical explainer video with Seqvio using a dark sketch whiteboard explainer style:

- Use @seqvio/whiteboard.
- Use a dark background and Excalidraw-like hand-drawn lines.
- Use DrawText, DrawShape, arrows, loop diagrams, flowcharts, and node diagrams to explain concepts.
- Do not make a product marketing page.
- Do not use realistic photos or complex 3D.
- The visual language should feel like an engineer explaining system design on a dark whiteboard.

Topic: <your topic>
Target audience: <AI engineers / product managers / developers / beginners>
Video length: <5-8 minutes / 10 minutes / 8-12 minutes>
Language: Chinese

Narration style:
- Calm, clear, engineering-oriented Chinese narration.
- Avoid hype and marketing language.
- Explain ideas with concrete examples.
- Each section should start with a clear point, then expand with an engineering example.

Structure:
1. Open with the core problem.
2. Explain the main concept.
3. Break it into 4-6 engineering components.
4. Connect the idea with one loop diagram or system diagram.
5. Give practical implementation advice.
6. Summarize the main takeaway.

Please generate a TSX composition with meta.audio.narration.
Each narration cue should map to one scene through sceneId.
Each scene should have a clear title, short subtitle, hand-drawn diagram, and local animation.
Use ElevenLabs for natural voice narration and render the final MP4.
```

## Loop Engineering Style Example

```text
Use Seqvio to create a dark sketch whiteboard explainer video, using examples/compositions/loop-engineering-explainer.tsx as the style reference.

Topic: Why AI Agents Need External Memory
Audience: Developers familiar with AI tools and software engineering
Length: 8-12 minutes
Language: Chinese

Visual style:
- Dark background, close to #20201f.
- Hand-drawn whiteboard lines with an Excalidraw feel.
- Use colorful emphasis strokes and arrows: yellow, blue, green, purple, and pink.
- Each scene should center on one conceptual diagram: loop diagram, state file, task queue, verification gate, or agent handoff diagram.
- Keep on-screen text short. Use large titles, short annotations, and let diagrams explain the idea.

Narration style:
- Chinese technical podcast tone.
- Calm, clear, and opinionated like an experienced engineer.
- No marketing tone. No exaggerated slogans.
- Each section should present one point and then ground it in an engineering example.
- Emphasize verification, state, permissions, boundaries, review, recoverability, and auditability.

Structure:
1. Why chat history is not reliable memory.
2. What external state solves.
3. Three state carriers: Markdown, issue tracker, and database.
4. How an agent loop reads and updates state.
5. Failure recovery and human handoff.
6. A minimal practical implementation.
7. Summary.

Please create a Seqvio TSX composition using @seqvio/whiteboard and a darkSketchTheme based on excalidrawTheme.
Include meta.audio.narration, and align every narration cue with a sceneId.
```

## Useful Keywords

- `dark sketch whiteboard explainer`
- `dark Excalidraw-style hand-drawn whiteboard`
- `暗色 Excalidraw 手绘白板风格`
- `工程师口吻的中文技术科普`
- `用流程图、循环图、节点图解释概念`
- `少装饰，多结构图，多验证和工程落地`
