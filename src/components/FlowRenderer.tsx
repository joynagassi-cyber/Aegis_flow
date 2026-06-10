import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Code, Move } from 'lucide-react';

interface FlowData {
  nodes: { id: string; label: string; type?: string; x: number; y: number; color?: string }[];
  edges: { id: string; source: string; target: string; label?: string; animated?: boolean }[];
}

function parseFlowContent(content: string): FlowData {
  try {
    return JSON.parse(content) as FlowData;
  } catch {
    const lines = content.split('\n').filter(l => l.trim());
    const nodes: FlowData['nodes'] = [];
    const edges: FlowData['edges'] = [];

    for (const line of lines) {
      const nodeMatch = line.match(/^\[(\w+)\]\s*(.+?)(?:\s*\{(\w+)\})?\s*@\(([-\d.]+),\s*([-\d.]+)\)/);
      if (nodeMatch) {
        nodes.push({
          id: nodeMatch[1],
          label: nodeMatch[2],
          type: nodeMatch[3] || 'process',
          x: parseFloat(nodeMatch[4]),
          y: parseFloat(nodeMatch[5]),
        });
        continue;
      }
      const edgeMatch = line.match(/^\((\w+)\)\s*-->\s*\((\w+)\)(?:\s*:\s*(.+))?/);
      if (edgeMatch) {
        edges.push({
          id: `e-${edgeMatch[1]}-${edgeMatch[2]}`,
          source: edgeMatch[1],
          target: edgeMatch[2],
          label: edgeMatch[3],
        });
      }
    }
    return { nodes, edges };
  }
}

const COLORS: Record<string, string> = {
  start: '#22c55e',
  process: '#3b82f6',
  decision: '#eab308',
  end: '#ef4444',
  io: '#8b5cf6',
  default: '#64748b',
};

function CustomNode({ data, selected }: NodeProps) {
  const color = (data as any).color || COLORS[(data as any).nodeType || 'default'] || COLORS.default;
  const isDecision = (data as any).nodeType === 'decision';

  return (
    <div
      className={`relative rounded-xl border-2 px-4 py-2 text-xs font-bold shadow-lg transition ${
        selected ? 'ring-2 ring-[var(--accent)]' : ''
      }`}
      style={{
        background: `${color}18`,
        borderColor: selected ? 'var(--accent)' : color,
        color: color,
        minWidth: 80,
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} className="!border-[var(--border)] !bg-[var(--surface-2)]" />
      {data.label as string}
      <Handle type="source" position={Position.Bottom} className="!border-[var(--border)] !bg-[var(--surface-2)]" />
      {isDecision && (
        <>
          <Handle type="source" position={Position.Left} id="left" className="!border-[var(--border)] !bg-[var(--surface-2)]" />
          <Handle type="source" position={Position.Right} id="right" className="!border-[var(--border)] !bg-[var(--surface-2)]" />
        </>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { custom: CustomNode };

interface FlowRendererProps {
  content: string;
}

export function FlowRenderer({ content }: FlowRendererProps) {
  const [view, setView] = useState<'flow' | 'code'>('flow');

  const parsed = useMemo(() => parseFlowContent(content), [content]);

  const initialNodes: Node[] = useMemo(
    () =>
      parsed.nodes.map(n => ({
        id: n.id,
        type: 'custom',
        position: { x: n.x, y: n.y },
        data: { label: n.label, nodeType: n.type || 'process', color: n.color },
      })),
    [parsed.nodes],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      parsed.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated,
        style: { stroke: '#64748b', strokeWidth: 2 },
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: 'transparent' },
      })),
    [parsed.edges],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, style: { stroke: '#64748b', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const defaultEdgeOptions = { animated: true, style: { stroke: '#64748b', strokeWidth: 2 } };

  if (view === 'code') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
          <button
            onClick={() => setView('flow')}
            className="rounded px-2 py-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <Move className="mr-1 inline h-3 w-3" /> Flow
          </button>
          <span className="text-xs text-[var(--text-muted)]">{parsed.nodes.length} nœuds · {parsed.edges.length} liens</span>
        </div>
        <pre className="flex-1 overflow-auto p-4 text-xs text-[var(--text-muted)] font-mono whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
          <Move className="h-3.5 w-3.5" /> Flow interactif
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-muted)]">{parsed.nodes.length} nœuds</span>
          <button
            onClick={() => setView('code')}
            className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-3)]"
            title="Voir le code"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1" style={{ height: '100%', minHeight: 300 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#333" gap={20} size={1} />
          <Controls showInteractive={false} className="!bg-[var(--surface-2)] !border-[var(--border)] !rounded-lg" />
          <MiniMap
            nodeColor={n => COLORS[(n.data as any)?.nodeType || 'default'] || COLORS.default}
            maskColor="rgba(0,0,0,0.6)"
            className="!border-[var(--border)] !rounded-lg"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
