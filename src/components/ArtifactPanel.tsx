import { useState } from 'react';
import { ArtifactRenderer } from './ArtifactRenderer';
import { X, Download, FileText, Grid3x3, FileJson, FileType, Image } from 'lucide-react';
import type { RichArtifact } from '../services/artifactDetector';

interface ArtifactData {
  title: string;
  content: string;
  language?: string;
  type?: string;
}

interface ArtifactPanelProps {
  artifact: ArtifactData | null;
  onClose: () => void;
  onOpenCanvas?: (artifacts: RichArtifact[]) => void;
}

function toRichArtifact(a: ArtifactData): RichArtifact {
  const typeMap: Record<string, string> = {
    html: 'html', json: 'json', csv: 'csv', markdown: 'markdown', md: 'markdown',
    svg: 'diagram', mermaid: 'diagram', chart: 'chart', widget: 'widget',
  };
  return {
    id: crypto.randomUUID(),
    type: (typeMap[a.type || a.language || ''] || 'markdown') as RichArtifact['type'],
    title: a.title,
    content: a.content,
    language: a.language || a.type,
  };
}

const EXPORT_FORMATS = [
  { id: 'md', label: 'Markdown', icon: FileText },
  { id: 'html', label: 'HTML', icon: FileType },
  { id: 'json', label: 'JSON', icon: FileJson },
  { id: 'png', label: 'PNG', icon: Image },
];

export function ArtifactPanel({ artifact, onClose, onOpenCanvas }: ArtifactPanelProps) {
  const [showExport, setShowExport] = useState(false);

  if (!artifact) return null;

  const rich = toRichArtifact(artifact);

  const handleDownload = (format?: string) => {
    const fmt = format || artifact.language || 'txt';
    const ext = fmt === 'markdown' ? 'md' : fmt;
    let content = artifact.content;

    if (fmt === 'html') {
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${artifact.title}</title><style>body{font-family:system-ui;padding:2rem;line-height:1.6;max-width:800px;margin:0 auto}</style></head><body>${artifact.language === 'markdown' ? `<pre>${artifact.content}</pre>` : artifact.content}</body></html>`;
    } else if (fmt === 'json') {
      try { content = JSON.stringify(JSON.parse(artifact.content), null, 2); } catch {}
    }

    const mime: Record<string, string> = { md: 'text/markdown', html: 'text/html', json: 'application/json', csv: 'text/csv', txt: 'text/plain' };
    const blob = new Blob([content], { type: mime[ext] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  return (
    <div className="artifact-panel-container">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <h3 className="truncate text-sm font-bold text-[var(--text)]">{artifact.title}</h3>
          <span className="shrink-0 rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--text-muted)]">
            {rich.type}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="relative">
            <button onClick={() => setShowExport(!showExport)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition" title="Exporter">
              <Download className="h-4 w-4" />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl z-50">
                {EXPORT_FORMATS.map(fmt => (
                  <button key={fmt.id} onClick={() => handleDownload(fmt.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
                    <fmt.icon className="h-3.5 w-3.5" /> {fmt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {onOpenCanvas && (
            <button onClick={() => onOpenCanvas([rich])} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition" title="Ouvrir dans le Canvas">
              <Grid3x3 className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="artifact-panel-content">
        <ArtifactRenderer artifact={rich} />
      </div>
    </div>
  );
}
