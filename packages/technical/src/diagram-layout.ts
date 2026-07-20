export interface DiagramNodeInput {
  id: string;
  label: string;
  groupId?: string;
}

export interface DiagramEdgeInput {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface LayoutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  groupId?: string;
}

export interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  points: Array<{ x: number; y: number }>;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;
const H_GAP = 120;
const V_GAP = 90;
const PAD = 80;

function stableSort<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

export function layoutDiagram(
  nodes: DiagramNodeInput[],
  edges: DiagramEdgeInput[],
  width: number,
  height: number
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const sortedNodes = stableSort(nodes);
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of sortedNodes) {
    indegree.set(node.id, 0);
    outgoing.set(node.id, []);
  }
  for (const edge of edges) {
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }

  const layers: string[][] = [];
  let frontier = sortedNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .map((node) => node.id);

  const visited = new Set<string>();
  while (frontier.length > 0) {
    const layer = stableSort(
      frontier.map((id) => ({ id })).filter((item) => !visited.has(item.id))
    ).map((item) => item.id);
    if (layer.length === 0) break;
    layers.push(layer);
    for (const id of layer) visited.add(id);
    const next = new Set<string>();
    for (const id of layer) {
      for (const target of outgoing.get(id) ?? []) {
        if (!visited.has(target)) next.add(target);
      }
    }
    frontier = [...next];
  }

  const remaining = sortedNodes
    .map((node) => node.id)
    .filter((id) => !visited.has(id));
  if (remaining.length > 0) layers.push(remaining);

  const layoutNodes: LayoutNode[] = [];
  const nodeById = new Map(sortedNodes.map((node) => [node.id, node]));
  const maxLayerSize = Math.max(1, ...layers.map((layer) => layer.length));
  const totalWidth = Math.max(width - PAD * 2, maxLayerSize * (NODE_WIDTH + H_GAP));
  const startX = PAD + Math.max(0, (width - totalWidth) / 2);

  layers.forEach((layer, layerIndex) => {
    const layerWidth = layer.length * NODE_WIDTH + Math.max(0, layer.length - 1) * H_GAP;
    const layerStartX = startX + Math.max(0, (totalWidth - layerWidth) / 2);
    const y = PAD + layerIndex * (NODE_HEIGHT + V_GAP);
    layer.forEach((nodeId, index) => {
      const node = nodeById.get(nodeId);
      if (!node) return;
      layoutNodes.push({
        id: node.id,
        label: node.label,
        groupId: node.groupId,
        x: layerStartX + index * (NODE_WIDTH + H_GAP),
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });
  });

  const positioned = new Map(layoutNodes.map((node) => [node.id, node]));
  const layoutEdges: LayoutEdge[] = edges.map((edge) => {
    const from = positioned.get(edge.from);
    const to = positioned.get(edge.to);
    if (!from || !to) {
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label,
        points: [],
      };
    }
    const start = {
      x: from.x + from.width,
      y: from.y + from.height / 2,
    };
    const end = {
      x: to.x,
      y: to.y + to.height / 2,
    };
    const midX = (start.x + end.x) / 2;
    return {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.label,
      points: [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end],
    };
  });

  return { nodes: layoutNodes, edges: layoutEdges };
}

export type DiagramStep =
  | { at: number; action: 'reveal'; targetId: string }
  | { at: number; action: 'connect'; edgeId: string }
  | { at: number; action: 'trace'; edgeId: string }
  | { at: number; action: 'emphasize'; targetId: string };

export function diagramVisibility(
  steps: DiagramStep[],
  frame: number
): { revealedNodes: Set<string>; activeEdges: Set<string>; emphasized: Set<string> } {
  const revealedNodes = new Set<string>();
  const activeEdges = new Set<string>();
  const emphasized = new Set<string>();
  const sorted = [...steps].sort((a, b) => a.at - b.at);
  for (const step of sorted) {
    if (frame < step.at) continue;
    if (step.action === 'reveal') revealedNodes.add(step.targetId);
    if (step.action === 'connect' || step.action === 'trace') activeEdges.add(step.edgeId);
    if (step.action === 'emphasize') emphasized.add(step.targetId);
  }
  return { revealedNodes, activeEdges, emphasized };
}
