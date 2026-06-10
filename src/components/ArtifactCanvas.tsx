import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArtifactRenderer } from './ArtifactRenderer';
import type { RichArtifact } from '../services/artifactDetector';
import { X, Download, Grid3x3, Columns2, Columns3, Maximize2, Minimize2, GripVertical } from 'lucide-react';

interface CanvasItem {
  id: string;
  artifact: RichArtifact;
  width: 1 | 2 | 3;
  height: 1 | 2;
}

interface ArtifactCanvasProps {
  artifacts: RichArtifact[];
  onClose: () => void;
  onRemove?: (id: string) => void;
  onTransform?: (source: RichArtifact, targetType: string) => void;
}

type Layout = 'grid' | 'columns-2' | 'columns-3';

const LAYOUT_ICONS: Record<Layout, any> = {
  'grid': Grid3x3,
  'columns-2': Columns2,
  'columns-3': Columns3,
};

export function ArtifactCanvas({ artifacts, onClose, onRemove, onTransform }: ArtifactCanvasProps) {
  const [layout, setLayout] = useState<Layout>('grid');
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const [items, setItems] = useState<CanvasItem[]>(() =>
    artifacts.map(a => ({ id: a.id, artifact: a, width: 1 as const, height: 1 as const }))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems(prev => {
      const oldIdx = prev.findIndex(i => i.id === active.id);
      const newIdx = prev.findIndex(i => i.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(oldIdx, 1);
      copy.splice(newIdx, 0, moved);
      return copy;
    });
  }, []);

  const handleExportAll = useCallback(() => {
    const html = items.map(item =>
      `<!-- ${item.artifact.title} (${item.artifact.type}) -->\n${item.artifact.content}`
    ).join('\n\n---\n\n');

    const blob = new Blob([`# Artifact Canvas Export\n\n${html}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifacts-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    onRemove?.(id);
  };

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <Grid3x3 className="h-12 w-12 text-[var(--surface-3)] mb-3" />
        <p className="text-sm font-bold text-[var(--text)]">Canvas vide</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Génère des artefacts dans le chat pour les voir ici</p>
      </div>
    );
  }

  if (fullscreenId) {
    const item = items.find(i => i.id === fullscreenId);
    if (!item) return null;
    return (
      <div className="fixed inset-0 z-50 bg-[var(--surface)] flex flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--text)]">{item.artifact.title}</span>
            <span className="rounded bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">{item.artifact.type}</span>
          </div>
          <button onClick={() => setFullscreenId(null)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1">
          <ArtifactRenderer artifact={item.artifact} onTransformation={onTransform} fullscreen />
        </div>
      </div>
    );
  }

  const itemIds = items.map(i => i.id);
  const sortStrategy = layout === 'grid' ? horizontalListSortingStrategy : verticalListSortingStrategy;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm font-bold text-[var(--text)]">Canvas</span>
          <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] text-[var(--accent)]">{items.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {(['grid', 'columns-2', 'columns-3'] as Layout[]).map(l => {
            const Icon = LAYOUT_ICONS[l];
            return (
              <button key={l} onClick={() => setLayout(l)}
                className={`rounded-lg p-1.5 transition ${layout === l ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
          <div className="mx-1 h-4 w-px bg-[var(--border)]" />
          <button onClick={handleExportAll} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]" title="Tout exporter">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={sortStrategy}>
          <div className={`flex-1 overflow-auto p-4 ${layout === 'columns-2' ? 'space-y-4' : layout === 'columns-3' ? 'space-y-4' : ''}`}>
            {layout === 'grid' ? (
              <div className="grid grid-cols-2 gap-4">
                {items.map(item => (
                  <SortableCanvasCard key={item.id} item={item}
                    onFullscreen={setFullscreenId}
                    onRemove={handleRemove}
                    onTransform={onTransform}
                  />
                ))}
              </div>
            ) : (
              items.map(item => (
                <SortableCanvasCard key={item.id} item={item}
                  onFullscreen={setFullscreenId}
                  onRemove={handleRemove}
                  onTransform={onTransform}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCanvasCard({ item, onFullscreen, onRemove, onTransform }: {
  item: CanvasItem;
  onFullscreen: (id: string) => void;
  onRemove: (id: string) => void;
  onTransform?: (source: RichArtifact, targetType: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const isInteractive = item.artifact.type === 'widget' || item.artifact.type === 'chart' || item.artifact.metadata?.interactive;

  return (
    <div ref={setNodeRef} style={style}
      className={`flex flex-col overflow-hidden rounded-xl border transition ${
        isDragging ? 'border-[var(--accent)] shadow-lg' : 'border-[var(--border)] hover:border-[var(--accent)]/30'
      } bg-[var(--surface-1)]`}>
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <button {...attributes} {...listeners}
            className="cursor-grab rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text)] active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="truncate text-xs font-bold text-[var(--text)]">{item.artifact.title}</span>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
            isInteractive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
          }`}>{item.artifact.type}</span>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button onClick={() => onFullscreen(item.id)} className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
            <Maximize2 className="h-3 w-3" />
          </button>
          <button onClick={() => onRemove(item.id)} className="rounded p-1 text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="min-h-[200px] flex-1">
        <ArtifactRenderer artifact={item.artifact} onTransformation={onTransform} />
      </div>
    </div>
  );
}
