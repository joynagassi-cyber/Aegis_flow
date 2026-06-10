import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SyntaxHighlighter, oneDark } from '../utils/syntaxHighlighter';
import { Play, RefreshCw, BarChart3, Code, RotateCcw } from 'lucide-react';
import type { RichArtifact } from '../services/artifactDetector';
import { updateWidgetState, getWidgetState } from '../store/artifactStore';
import { FlowRenderer } from './FlowRenderer';

interface ArtifactRendererProps {
  artifact: RichArtifact;
  onTransformation?: (source: RichArtifact, targetType: string) => void;
  fullscreen?: boolean;
}

export function ArtifactRenderer(props: ArtifactRendererProps) {
  const { artifact, fullscreen } = props;
  const lang = artifact.language || '';

  switch (artifact.type) {
    case 'chart':
      return <ChartRenderer content={artifact.content} lang={lang} />;
    case 'diagram':
      return <DiagramRenderer content={artifact.content} lang={lang} />;
    case 'widget':
      return <WidgetRenderer content={artifact.content} lang={lang} artifactId={artifact.id} />;
    case 'flow':
      return <FlowRenderer content={artifact.content} />;
    case 'dashboard':
      return <DashboardRenderer content={artifact.content} />;
    case 'notebook':
      return <NotebookRenderer content={artifact.content} />;
    default:
      return <DefaultRenderer artifact={artifact} fullscreen={fullscreen} />;
  }
}

const MARKDOWN_COMPONENTS = {
  h1: ({ children }: any) => <h1 className="mb-4 mt-6 text-xl font-bold text-[var(--text)] border-b border-[var(--border)] pb-2 first:mt-0">{children}</h1>,
  h2: ({ children }: any) => <h2 className="mb-3 mt-5 text-lg font-bold text-[var(--text)]">{children}</h2>,
  h3: ({ children }: any) => <h3 className="mb-2 mt-4 text-base font-bold text-[var(--text)]">{children}</h3>,
  h4: ({ children }: any) => <h4 className="mb-2 mt-3 text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">{children}</h4>,
  p: ({ children }: any) => <p className="mb-3 leading-7 text-[var(--text)] text-sm">{children}</p>,
  strong: ({ children }: any) => <strong className="font-bold text-[var(--text)]">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-[var(--accent)]">{children}</em>,
  ul: ({ children }: any) => <ul className="mb-3 list-disc pl-5 space-y-1.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-3 list-decimal pl-5 space-y-1.5">{children}</ol>,
  li: ({ children }: any) => <li className="text-sm leading-6 text-[var(--text)] marker:text-[var(--accent)]">{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote className="mb-3 border-l-3 border-[var(--accent)] bg-[var(--accent)]/5 pl-4 py-2 rounded-r-lg text-sm italic text-[var(--text-muted)]">
      {children}
    </blockquote>
  ),
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');
    if (!match) {
      return <code className="rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 text-sm font-mono text-[var(--accent)]" {...props}>{children}</code>;
    }
    return (
      <div className="my-4 overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="flex items-center justify-between bg-[var(--surface-3)] px-4 py-1.5 border-b border-[var(--border)]">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">{match[1]}</span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="rounded px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition font-bold"
            title="Copier"
          >
            Copier
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px', lineHeight: '1.6' }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  },
  table({ children }: any) {
    return (
      <div className="my-4 overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    );
  },
  thead({ children }: any) {
    return <thead className="bg-[var(--surface-3)]">{children}</thead>;
  },
  th({ children }: any) {
    return <th className="border-b border-[var(--border)] px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{children}</th>;
  },
  td({ children }: any) {
    return <td className="border-b border-[var(--border)] px-4 py-2 text-sm text-[var(--text)]">{children}</td>;
  },
  hr: () => <hr className="my-6 border-[var(--border)]" />,
  a: ({ children, href }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline decoration-[var(--accent)]/30 hover:decoration-[var(--accent)] transition">
      {children}
    </a>
  ),
  img: ({ src, alt }: any) => (
    <img src={src} alt={alt} className="my-4 max-w-full rounded-xl border border-[var(--border)]" loading="lazy" />
  ),
};

const CODE_LANG_LABELS: Record<string, string> = {
  html: 'HTML', json: 'JSON', csv: 'CSV', markdown: 'MARKDOWN', md: 'MARKDOWN',
  svg: 'SVG', js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
  py: 'Python', python: 'Python', css: 'CSS', scss: 'SCSS', sql: 'SQL',
  bash: 'Bash', sh: 'Shell', yaml: 'YAML', yml: 'YAML', xml: 'XML',
  go: 'Go', rust: 'Rust', cpp: 'C++', c: 'C', java: 'Java', rb: 'Ruby',
};

const CODE_THEME_COLORS: Record<string, { bg: string; border: string; label: string; accent: string }> = {
  html: { bg: 'rgba(255,87,34,0.08)', border: 'rgba(255,87,34,0.2)', label: '#ff5722', accent: '#ff5722' },
  json: { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', label: '#eab308', accent: '#eab308' },
  csv: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', label: '#22c55e', accent: '#22c55e' },
  markdown: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: '#3b82f6', accent: '#3b82f6' },
  md: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: '#3b82f6', accent: '#3b82f6' },
  svg: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', label: '#8b5cf6', accent: '#8b5cf6' },
  js: { bg: 'rgba(255,204,0,0.08)', border: 'rgba(255,204,0,0.2)', label: '#ffcc00', accent: '#ffcc00' },
  ts: { bg: 'rgba(49,120,198,0.08)', border: 'rgba(49,120,198,0.2)', label: '#3178c6', accent: '#3178c6' },
  py: { bg: 'rgba(55,118,171,0.08)', border: 'rgba(55,118,171,0.2)', label: '#3776ab', accent: '#3776ab' },
  default: { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', label: '#64748b', accent: '#64748b' },
};

function MarkdownPreview({ content, className }: { content: string; className?: string }) {
  return (
    <div className={`markdown-preview ${className || ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeView({ content, lang }: { content: string; lang: string }) {
  const theme = CODE_THEME_COLORS[lang] || CODE_THEME_COLORS.default;
  const label = CODE_LANG_LABELS[lang] || lang.toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center justify-between border-b px-4 py-2 sticky top-0 z-10"
        style={{ background: theme.bg, borderColor: theme.border }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.label }}>{label}</span>
          <span className="text-[10px] text-[var(--text-muted)]">{content.split('\n').length} lignes</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="rounded px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition"
          >
            Copier
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          style={oneDark}
          language={lang}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '13px',
            lineHeight: '1.7',
            minHeight: '100%',
          }}
          showLineNumbers
          wrapLines
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function DefaultRenderer({ artifact, fullscreen }: { artifact: RichArtifact; fullscreen?: boolean }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const lang = artifact.language || '';

  const renderPreview = () => {
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
      case 'json': {
        try {
          const parsed = JSON.parse(artifact.content);
          return <JsonTree data={parsed} depth={0} />;
        } catch {
          return <pre className="text-sm text-red-400 whitespace-pre-wrap p-4">{artifact.content}</pre>;
        }
      }
      case 'csv':
        return <CsvTable data={artifact.content} interactive />;
      case 'svg':
        return <div className="flex items-center justify-center p-4 h-full" dangerouslySetInnerHTML={{ __html: artifact.content }} />;
      case 'markdown':
      case 'md':
        return <MarkdownPreview content={artifact.content} className="p-6" />;
      default:
        return (
          <div className="p-4">
            <CodeView content={artifact.content} lang={lang} />
          </div>
        );
    }
  };

  return (
    <div className="flex h-full flex-col" style={{ maxHeight: fullscreen ? '100vh' : '100%' }}>
      <div className="flex border-b border-[var(--border)] bg-[var(--surface-1)] shrink-0">
        <button onClick={() => setTab('preview')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition ${
            tab === 'preview' ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}>Aperçu</button>
        <button onClick={() => setTab('code')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition ${
            tab === 'code' ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}>Code</button>
      </div>
      <div className="flex-1 overflow-auto scroll-smooth">
        {tab === 'preview' ? renderPreview() : (
          <CodeView content={artifact.content} lang={lang} />
        )}
      </div>
    </div>
  );
}

function CsvTable({ data, interactive }: { data: string; interactive?: boolean }) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState('');

  const lines = data.split('\n').filter(l => l.trim());
  if (lines.length < 2) return <pre className="text-sm text-[var(--text)] whitespace-pre-wrap">{data}</pre>;

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = useMemo(() => {
    let r = lines.slice(1).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    if (search) r = r.filter(row => row.some(c => c.toLowerCase().includes(search.toLowerCase())));
    if (sortCol !== null) r = [...r].sort((a, b) => {
      const va = a[sortCol] || '', vb = b[sortCol] || '';
      const na = parseFloat(va), nb = parseFloat(vb);
      if (!isNaN(na) && !isNaN(nb)) return sortAsc ? na - nb : nb - na;
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return r;
  }, [data, sortCol, sortAsc, search]);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      {interactive && (
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filtrer..." className="flex-1 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text)] placeholder-[var(--text-muted)] outline-none" />
          <span className="text-[10px] text-[var(--text-muted)]">{rows.length} lignes</span>
        </div>
      )}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0">
            <tr>
              {headers.map((h, i) => (
                <th key={i} onClick={() => { setSortCol(i); setSortAsc(sortCol === i ? !sortAsc : true); }}
                  className={`cursor-pointer border-b border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] ${sortCol === i ? 'text-[var(--accent)]' : ''}`}>
                  {h} {sortCol === i ? (sortAsc ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-[var(--surface-2)]">
                {row.map((cell, ci) => (
                  <td key={ci} className="border-b border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)]">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JsonTree({ data, depth }: { data: unknown; depth: number }) {
  const [collapsed, setCollapsed] = useState(depth > 1);
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);

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
            <div key={key}>
              <span className="text-sm font-bold text-[var(--accent)]">{isArray ? '' : `"${key}"`}</span>
              {!isArray && <span className="text-sm text-[var(--text-muted)]">: </span>}
              <JsonTree data={val} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartRenderer({ content, lang }: { content: string; lang: string; }) {
  const [view, setView] = useState<'preview' | 'code'>('preview');

  if (view === 'code') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex border-b border-[var(--border)]">
          <button onClick={() => setView('preview')} className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)]">Aperçu</button>
          <button onClick={() => setView('code')} className="border-b-2 border-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent)]">Code</button>
        </div>
        <SyntaxHighlighter style={oneDark} language={lang} customStyle={{ borderRadius: 0, fontSize: '13px', flex: 1 }}>
          {content}
        </SyntaxHighlighter>
      </div>
    );
  }

  const isMermaid = lang === 'mermaid';
  const isHtml = lang === 'html' || content.includes('<html') || content.includes('<svg');

  if (isMermaid) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
          <span className="text-xs font-bold text-[var(--text-muted)]">Diagramme</span>
          <button onClick={() => setView('code')} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><Code className="h-3.5 w-3.5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{`\`\`\`mermaid\n${content}\n\`\`\``}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  if (isHtml) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
          <span className="text-xs font-bold text-[var(--text-muted)]">Graphique</span>
          <div className="flex gap-1">
            <button onClick={() => setView('code')} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><Code className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <iframe srcDoc={content} className="flex-1 w-full border-0 bg-white" title="Chart" sandbox="allow-scripts" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <BarChart3 className="h-12 w-12 text-[var(--surface-3)] mb-3" />
      <p className="text-sm text-[var(--text-muted)]">Aperçu du graphique</p>
      <button onClick={() => setView('code')} className="mt-2 rounded-lg bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-bold text-[var(--accent)]">Voir le code</button>
    </div>
  );
}

function DiagramRenderer({ content, lang }: { content: string; lang: string }) {
  const [view, setView] = useState<'preview' | 'code'>('preview');

  if (view === 'code' || (lang !== 'mermaid' && lang !== 'svg')) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex border-b border-[var(--border)]">
          <button onClick={() => setView('preview')} className={`px-4 py-2 text-xs font-bold ${view === 'preview' ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>Aperçu</button>
          <button onClick={() => setView('code')} className={`px-4 py-2 text-xs font-bold ${view === 'code' ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>Code</button>
        </div>
        <SyntaxHighlighter style={oneDark} language={lang} customStyle={{ borderRadius: 0, fontSize: '13px', flex: 1 }}>{content}</SyntaxHighlighter>
      </div>
    );
  }

  if (lang === 'svg') {
    return <div className="flex items-center justify-center p-4 h-full" dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="text-xs font-bold text-[var(--text-muted)]">Diagramme {lang}</span>
        <div className="flex gap-1">
          <button onClick={() => setView('code')} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><Code className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{`\`\`\`${lang}\n${content}\n\`\`\``}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function WidgetRenderer({ content, lang, artifactId }: { content: string; lang: string; artifactId: string }) {
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [widgetState, setWidgetLocal] = useState<Record<string, unknown>>(() => getWidgetState(artifactId));

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'widget:state' && e.data?.widgetId === artifactId) {
        const newState = e.data.state as Record<string, unknown>;
        setWidgetLocal(prev => ({ ...prev, ...newState }));
        updateWidgetState(artifactId, newState);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [artifactId]);

  const injectStateScript = useCallback((html: string, state: Record<string, unknown>) => {
    const stateScript = `<script>window.__WIDGET_STATE__ = ${JSON.stringify(state)}; window.__WIDGET_ID__ = ${JSON.stringify(artifactId)}; (() => { const origPost = parent.postMessage.bind(parent); window.__postWidgetState = (s) => origPost({ type: 'widget:state', widgetId: window.__WIDGET_ID__, state: s }, '*'); })();<\/script>`;
    return html.replace('<head>', `<head>${stateScript}`).replace('<html>', `<html><head>${stateScript}</head>`);
  }, [artifactId]);

  const enhancedContent = useMemo(() => {
    return content.includes('<html') || content.includes('<!DOCTYPE')
      ? injectStateScript(content, widgetState)
      : `<!DOCTYPE html><html><head>${injectStateScript('', widgetState)}</head><body>${content}</body></html>`;
  }, [content, widgetState, injectStateScript]);

  const handleReset = () => {
    setWidgetLocal({});
    updateWidgetState(artifactId, {});
    setKey(k => k + 1);
  };

  if (view === 'code') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
          <div className="flex gap-0">
            <button onClick={() => setView('preview')} className="px-3 py-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)]">Aperçu</button>
            <button onClick={() => setView('code')} className="border-b-2 border-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--accent)]">Code</button>
          </div>
          <button onClick={handleReset} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
        <SyntaxHighlighter style={oneDark} language={lang} customStyle={{ borderRadius: 0, fontSize: '13px', flex: 1 }}>{content}</SyntaxHighlighter>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]"><Play className="h-3 w-3" /> Widget interactif</span>
        <div className="flex items-center gap-2">
          {Object.keys(widgetState).length > 0 && (
            <span className="text-[10px] text-[var(--text-muted)]">{Object.keys(widgetState).length} état{Object.keys(widgetState).length > 1 ? 's' : ''}</span>
          )}
          <button onClick={handleReset} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]" title="Réinitialiser"><RotateCcw className="h-3.5 w-3.5" /></button>
          <button onClick={() => setView('code')} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><Code className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <iframe key={key} ref={iframeRef} srcDoc={enhancedContent} className="flex-1 w-full border-0 bg-white" title="Widget" sandbox="allow-scripts" />
    </div>
  );
}

function DashboardRenderer({ content }: { content: string }) {
  const metrics = useMemo(() => {
    const lines = content.split('\n');
    const items: { label: string; value: string; change?: string }[] = [];
    for (const line of lines) {
      const match = line.match(/^- \*\*(.+?)\*\*:\s*([^\s(]+)\s*(?:\(([^)]+)\))?/);
      if (match) {
        items.push({ label: match[1], value: match[2], change: match[3] });
      }
    }
    return items;
  }, [content]);

  const trendIcon = (change?: string) => {
    if (!change) return null;
    const isUp = change.startsWith('+');
    return <span className={isUp ? 'text-emerald-400' : 'text-red-400'}>{isUp ? '▲' : '▼'}</span>;
  };

  if (metrics.length === 0) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">KPI Dashboard</span>
        <span className="text-[10px] text-[var(--text-muted)]">{metrics.length} indicateurs</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition hover:border-[var(--accent)]/30">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{m.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text)]">{m.value}</span>
              {m.change && (
                <span className="flex items-center gap-1 text-xs font-bold">
                  {trendIcon(m.change)} {m.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotebookRenderer({ content }: { content: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border)] px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400"><Play className="h-3 w-3" /> Notebook</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">Code</span>
            </div>
            <SyntaxHighlighter style={oneDark} language="python" customStyle={{ borderRadius: '8px', fontSize: '12px' }}>
              {content.includes('```') ? content.replace(/```\w*\n?/g, '') : content}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
}


