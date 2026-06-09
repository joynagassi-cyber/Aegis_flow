import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SyntaxHighlighter, oneDark } from '../utils/syntaxHighlighter';
import { X, Download, Code, Eye, FileText } from 'lucide-react';

interface ArtifactData {
  title: string;
  content: string;
  language?: string;
}

interface ArtifactPanelProps {
  artifact: ArtifactData | null;
  onClose: () => void;
}

export function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');

  if (!artifact) return null;

  const handleDownload = () => {
    const ext = (artifact.language || 'txt') === 'markdown' ? 'md' : artifact.language || 'txt';
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderPreview = () => {
    const lang = artifact.language || '';
    switch (lang) {
      case 'html':
        return (
          <iframe
            srcDoc={artifact.content}
            className="h-full w-full rounded-lg border-0 bg-white"
            title="HTML Preview"
            sandbox="allow-scripts"
          />
        );
      case 'json':
        try {
          const parsed = JSON.parse(artifact.content);
          return <JsonTree data={parsed} depth={0} />;
        } catch {
          return <pre className="text-sm text-red-400">{artifact.content}</pre>;
        }
      case 'csv':
        return <CsvTable data={artifact.content} />;
      case 'markdown':
      case 'md':
        return (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
          </div>
        );
      default:
        return <pre className="text-sm text-[var(--text)] whitespace-pre-wrap">{artifact.content}</pre>;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold text-[var(--text)]">{artifact.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleDownload} title="Télécharger" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={onClose} title="Fermer" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-[var(--border)]">
        <button
          onClick={() => setTab('preview')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition ${
            tab === 'preview' ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Eye className="h-3.5 w-3.5" /> Aperçu
        </button>
        <button
          onClick={() => setTab('code')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition ${
            tab === 'code' ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Code className="h-3.5 w-3.5" /> Code
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === 'preview' ? (
          renderPreview()
        ) : (
          <SyntaxHighlighter style={oneDark} language={artifact.language || 'markdown'} customStyle={{ borderRadius: '12px', fontSize: '13px' }}>
            {artifact.content}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}

function JsonTree({ data, depth }: { data: unknown; depth: number }) {
  const [collapsed, setCollapsed] = useState(depth > 1);
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);
  const indent = depth * 16;

  if (!isObject) {
    const val = typeof data === 'string' ? `"${data}"` : String(data);
    return <span className={`text-sm ${typeof data === 'string' ? 'text-green-400' : typeof data === 'number' ? 'text-blue-400' : 'text-purple-400'}`}>{val}</span>;
  }

  const entries = isArray ? (data as unknown[]).map((v, i) => [String(i), v] as const) : Object.entries(data as Record<string, unknown>);
  const bracket = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <div>
      <button onClick={() => setCollapsed(!collapsed)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        {collapsed ? '▶' : '▼'} {bracket[0]}
        {collapsed ? ` ${entries.length} ${entries.length > 1 ? 'éléments' : 'élément'} ` : ''}
        {collapsed ? bracket[1] : ''}
      </button>
      {!collapsed && (
        <div className="ml-4 space-y-0.5 border-l border-[var(--border)] pl-3">
          {entries.map(([key, val]) => (
            <div key={key} style={{ paddingLeft: indent }}>
              <span className="text-sm font-bold text-[var(--accent)]">{isArray ? '' : `"${key}"`}</span>
              {!isArray && <span className="text-sm text-[var(--text-muted)]">: </span>}
              {val !== null && typeof val === 'object' && Object.keys(val as object).length > 0 ? (
                <JsonTree data={val} depth={depth + 1} />
              ) : (
                <>
                  {val === null ? <span className="text-sm text-[var(--text-muted)]">null</span> : <JsonTree data={val} depth={depth + 1} />}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CsvTable({ data }: { data: string }) {
  const lines = data.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    return <pre className="text-sm text-[var(--text)] whitespace-pre-wrap">{data}</pre>;
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border-b border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border-b border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
