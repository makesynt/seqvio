import dagre from '@dagrejs/dagre';

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
  /** True when this node stands in for a collapsed group. */
  collapsedGroup?: boolean;
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
const GROUP_WIDTH = 200;
const GROUP_HEIGHT = 72;
const PAD = 72;

export type DiagramStep =
  | { at: number; action: 'reveal'; targetId: string }
  | { at: number; action: 'connect'; edgeId: string }
  | { at: number; action: 'trace'; edgeId: string }
  | { at: number; action: 'emphasize'; targetId: string }
  | { at: number; action: 'collapse'; groupId: string }
  | { at: number; action: 'expand'; groupId: string };

function groupProxyId(groupId: string): string {
  return `__group:${groupId}`;
}

function titleCaseGroup(groupId: string): string {
  return groupId
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Resolve which groups are collapsed at the current frame.
 * expand after collapse clears the collapsed state for that group.
 */
export function collapsedGroupsAt(steps: DiagramStep[], frame: number): Set<string> {
  const collapsed = new Set<string>();
  const sorted = [...steps].sort((a, b) => a.at - b.at);
  for (const step of sorted) {
    if (frame < step.at) continue;
    if (step.action === 'collapse') collapsed.add(step.groupId);
    if (step.action === 'expand') collapsed.delete(step.groupId);
  }
  return collapsed;
}

function resolveEndpoint(
  nodeId: string,
  nodeById: Map<string, DiagramNodeInput>,
  collapsed: Set<string>
): string {
  const node = nodeById.get(nodeId);
  if (!node?.groupId) return nodeId;
  if (collapsed.has(node.groupId)) return groupProxyId(node.groupId);
  return nodeId;
}

/**
 * Deterministic dagre layout. When groups are collapsed, member nodes are
 * replaced by a single proxy node and edges are rewritten to that proxy.
 */
export function layoutDiagram(
  nodes: DiagramNodeInput[],
  edges: DiagramEdgeInput[],
  width: number,
  height: number,
  collapsed: Set<string> = new Set()
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const visibleNodes: DiagramNodeInput[] = [];
  const seenGroups = new Set<string>();

  for (const node of nodes) {
    if (node.groupId && collapsed.has(node.groupId)) {
      if (!seenGroups.has(node.groupId)) {
        seenGroups.add(node.groupId);
        visibleNodes.push({
          id: groupProxyId(node.groupId),
          label: titleCaseGroup(node.groupId),
          groupId: node.groupId,
        });
      }
      continue;
    }
    visibleNodes.push(node);
  }

  const edgeMap = new Map<string, DiagramEdgeInput>();
  for (const edge of edges) {
    const from = resolveEndpoint(edge.from, nodeById, collapsed);
    const to = resolveEndpoint(edge.to, nodeById, collapsed);
    if (from === to) continue;
    const key = `${from}->${to}:${edge.label ?? ''}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, {
        id: edge.id,
        from,
        to,
        label: edge.label,
      });
    }
  }
  const visibleEdges = [...edgeMap.values()];

  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({
    rankdir: 'LR',
    nodesep: 48,
    ranksep: 96,
    marginx: PAD,
    marginy: PAD,
    edgesep: 24,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const node of visibleNodes) {
    const isGroup = node.id.startsWith('__group:');
    graph.setNode(node.id, {
      label: node.label,
      width: isGroup ? GROUP_WIDTH : NODE_WIDTH,
      height: isGroup ? GROUP_HEIGHT : NODE_HEIGHT,
    });
  }
  for (const edge of visibleEdges) {
    if (!graph.hasNode(edge.from) || !graph.hasNode(edge.to)) continue;
    graph.setEdge(edge.from, edge.to, { label: edge.label }, edge.id);
  }

  dagre.layout(graph);

  const layoutNodes: LayoutNode[] = visibleNodes.map((node) => {
    const placed = graph.node(node.id);
    const isGroup = Boolean(node.groupId && collapsed.has(node.groupId));
    const w = placed?.width ?? (isGroup ? GROUP_WIDTH : NODE_WIDTH);
    const h = placed?.height ?? (isGroup ? GROUP_HEIGHT : NODE_HEIGHT);
    return {
      id: node.id,
      label: node.label,
      groupId: node.groupId,
      collapsedGroup: isGroup,
      width: w,
      height: h,
      x: (placed?.x ?? 0) - w / 2,
      y: (placed?.y ?? 0) - h / 2,
    };
  });

  // Fit into viewport if dagre exceeds bounds.
  const maxX = Math.max(...layoutNodes.map((node) => node.x + node.width), 1);
  const maxY = Math.max(...layoutNodes.map((node) => node.y + node.height), 1);
  const scaleX = maxX > width - PAD ? (width - PAD * 2) / maxX : 1;
  const scaleY = maxY > height - PAD ? (height - PAD * 2) / maxY : 1;
  const scale = Math.min(1, scaleX, scaleY);
  if (scale < 1) {
    for (const node of layoutNodes) {
      node.x = PAD + node.x * scale;
      node.y = PAD + node.y * scale;
      node.width *= scale;
      node.height *= scale;
    }
  }

  const positioned = new Map(layoutNodes.map((node) => [node.id, node]));
  const layoutEdges: LayoutEdge[] = visibleEdges.map((edge) => {
    const edgeData = graph.edge(edge.from, edge.to, edge.id) as
      | { points?: Array<{ x: number; y: number }> }
      | undefined;
    const from = positioned.get(edge.from);
    const to = positioned.get(edge.to);
    if (edgeData?.points && edgeData.points.length >= 2) {
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label,
        points: edgeData.points.map((point) => ({
          x: PAD + (point.x - PAD) * scale,
          y: PAD + (point.y - PAD) * scale,
        })),
      };
    }
    if (!from || !to) {
      return { id: edge.id, from: edge.from, to: edge.to, label: edge.label, points: [] };
    }
    const start = { x: from.x + from.width, y: from.y + from.height / 2 };
    const end = { x: to.x, y: to.y + to.height / 2 };
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

export function diagramVisibility(
  steps: DiagramStep[],
  frame: number,
  nodes: DiagramNodeInput[] = []
): {
  revealedNodes: Set<string>;
  activeEdges: Set<string>;
  emphasized: Set<string>;
  collapsed: Set<string>;
} {
  const revealedNodes = new Set<string>();
  const activeEdges = new Set<string>();
  const emphasized = new Set<string>();
  const collapsed = collapsedGroupsAt(steps, frame);
  const sorted = [...steps].sort((a, b) => a.at - b.at);

  for (const step of sorted) {
    if (frame < step.at) continue;
    if (step.action === 'reveal') revealedNodes.add(step.targetId);
    if (step.action === 'connect' || step.action === 'trace') activeEdges.add(step.edgeId);
    if (step.action === 'emphasize') emphasized.add(step.targetId);
    if (step.action === 'collapse') {
      // Revealing a group proxy when collapsing so the subsystem stays visible.
      revealedNodes.add(groupProxyId(step.groupId));
    }
    if (step.action === 'expand') {
      revealedNodes.delete(groupProxyId(step.groupId));
    }
  }

  return { revealedNodes, activeEdges, emphasized, collapsed };
}

export { groupProxyId };
