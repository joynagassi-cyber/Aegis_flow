import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SyntaxHighlighter, oneDark } from '../utils/syntaxHighlighter';
import { Copy, Check, Bot, User, Terminal, FileCode, Loader2, FileText, FileJson, Table, FileType, Globe, Move, Brain, ChevronDown } from 'lucide-react';
import type { ChatMessage } from '../services/chatService';
import type { ToolCall } from '../services/agentClient';
import type { Artifact } from '../services/chatService';
import { ChatForm, hasFormBlock } from './ChatForm';

interface ChatMessageProps {
  message: ChatMessage;
  onSelectArtifact?: (content: string, lang: string) => void;
  onOpenArtifact?: (artifact: Artifact) => void;
  toolCalls?: ToolCall[];
  onFormSubmit?: (answers: string) => void;
}

const ARTIFACT_ICONS: Record<string, any> = {
  html: Globe,
  json: FileJson,
  csv: Table,
  markdown: FileText,
  md: FileText,
  svg: Globe,
  mermaid: FileType,
  flow: Move,
  chart: FileType,
  diagram: FileType,
};

const ARTIFACT_LABELS: Record<string, string> = {
  html: 'HTML',
  json: 'JSON',
  csv: 'CSV',
  markdown: 'Markdown',
  md: 'Markdown',
  svg: 'SVG',
  mermaid: 'Mermaid',
  flow: 'Flux',
  chart: 'Graphique',
  diagram: 'Diagramme',
};

function ToolCallBubble({ calls }: { calls: ToolCall[] }) {
  return (
    <div className="space-y-2 mb-3">
      {calls.map(tc => (
        <div key={tc.id} className="overflow-hidden rounded-lg border border-[var(--border)] bg-[#0d1117]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[#161b22] px-3 py-1.5">
            {tc.toolName === 'Bash' ? (
              <Terminal className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <FileCode className="h-3.5 w-3.5 text-blue-400" />
            )}
            <span className="text-[11px] font-bold text-[var(--text-muted)]">{tc.toolName}</span>
            {tc.status === 'running' && <Loader2 className="ml-auto h-3 w-3 animate-spin text-[var(--accent)]" />}
            {tc.args?.command && (
              <span className="ml-auto text-[10px] text-green-400 font-mono">$ {tc.args.command}</span>
            )}
            {tc.args?.file_path && (
              <span className="ml-auto text-[10px] text-blue-400 font-mono">{tc.args.file_path}</span>
            )}
          </div>
          {tc.result && (
            <pre className="max-h-32 overflow-auto p-2 text-[11px] leading-5 text-[#c9d1d9] whitespace-pre-wrap font-mono">
              {typeof tc.result === 'string' ? tc.result.slice(0, 2000) : JSON.stringify(tc.result).slice(0, 2000)}
              {(typeof tc.result === 'string' ? tc.result.length : JSON.stringify(tc.result).length) > 2000 ? '...' : ''}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

function ArtifactFileList({ artifacts, onOpen }: { artifacts: Artifact[]; onOpen: (a: Artifact) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {artifacts.map(a => {
        const Icon = ARTIFACT_ICONS[a.language || a.type] || FileText;
        const label = ARTIFACT_LABELS[a.language || ''] || a.type;
        return (
          <button
            key={a.id}
            onClick={() => onOpen(a)}
            className="group flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-muted)] transition hover:border-[var(--accent)]/30 hover:text-[var(--accent)] hover:bg-[var(--accent)]/5"
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[100px]">{a.title}</span>
            <span className="shrink-0 rounded bg-[var(--surface-3)] px-1 py-0.5 text-[8px] uppercase tracking-wider">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ChatBubble({ message, onSelectArtifact, onOpenArtifact, toolCalls, onFormSubmit }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const [showReasoning, setShowReasoning] = useState(true);
  const hasToolCalls = toolCalls && toolCalls.length > 0;
  const hasContent = message.content && message.content.trim().length > 0;
  const hasReasoning = !isUser && !!message.reasoning;
  const hasArtifacts = message.artifacts && message.artifacts.length > 0;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${
        isUser ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'
      }`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-[var(--accent)]" />}
      </div>

      <div className={`group max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {hasToolCalls && <ToolCallBubble calls={toolCalls} />}

        {hasReasoning && (
          <div className="overflow-hidden rounded-xl border border-purple-500/20 bg-purple-500/3">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex w-full items-center justify-between px-4 py-2 text-[11px] font-bold text-purple-400 hover:bg-purple-500/5 transition"
            >
              <div className="flex items-center gap-2">
                <Brain className="h-3.5 w-3.5" />
                Raisonnement
              </div>
              {showReasoning ? <ChevronDown className="h-3.5 w-3.5 rotate-180 transition" /> : <ChevronDown className="h-3.5 w-3.5 transition" />}
            </button>
            {showReasoning && (
              <div className="border-t border-purple-500/10 px-4 py-3 max-h-48 overflow-y-auto">
                <p className="text-xs leading-relaxed text-purple-300/80 whitespace-pre-wrap font-[family-name:var(--font-mono)]">
                  {message.reasoning}
                </p>
              </div>
            )}
          </div>
        )}

        {(hasContent || hasReasoning) && (
          <div className={`relative rounded-2xl px-5 py-4 ${
            isUser
              ? 'bg-[var(--primary)]/8 border border-[var(--primary)]/15'
              : 'bg-[var(--surface)] border border-[var(--border)]'
          }`}>
            <button
              onClick={() => handleCopy(message.content, isUser ? setCopiedUser : setCopied)}
              className={`absolute top-2 right-2 rounded-lg p-1.5 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-[var(--text)]`}
              title="Copier le message"
            >
              {(isUser ? copiedUser : copied) ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {isUser ? (
              <div>
                {message.content.startsWith('[') && message.content.includes('"image_url"') ? (
                  (() => {
                    try {
                      const parts = JSON.parse(message.content);
                      return parts.map((p: any, i: number) =>
                        p.type === 'image_url'
                          ? <img key={i} src={p.image_url.url} alt="Upload" className="max-w-full rounded-xl my-2 max-h-64 object-contain" />
                          : <p key={i} className="text-sm leading-6 text-[var(--text)] whitespace-pre-wrap">{p.text}</p>
                      );
                    } catch {
                      return <p className="text-sm leading-6 text-[var(--text)] whitespace-pre-wrap">{message.content}</p>;
                    }
                  })()
                ) : message.content.startsWith('data:image') ? (
                  <img src={message.content} alt="Upload" className="max-w-full rounded-xl max-h-64 object-contain" />
                ) : (
                  <p className="text-sm leading-6 text-[var(--text)] whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const code = String(children).replace(/\n$/, '');
                      const isInline = !match;

                      if (isInline) {
                        return <code className="rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-sm text-[var(--accent)]" {...props}>{children}</code>;
                      }

                      return (
                        <div className="group/code relative my-3">
                          <div className="flex items-center justify-between rounded-t-xl border border-[var(--border)] bg-[var(--surface-3)] px-4 py-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{match[1]}</span>
                            <div className="flex gap-1">
                              {onSelectArtifact && (
                                <button
                                  onClick={() => onSelectArtifact(code, match[1])}
                                  className="rounded px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] hover:bg-[var(--surface-2)] transition"
                                  title="Voir dans le panneau"
                                >
                                  +
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(code);
                                  const btn = document.activeElement;
                                  if (btn) {
                                    const orig = btn.innerHTML;
                                    btn.innerHTML = '<svg class="h-3 w-3 text-green-400" ...><path d="M5 13l4 4L19 7"/></svg>';
                                    setTimeout(() => { btn.innerHTML = orig; }, 2000);
                                  }
                                }}
                                className="rounded px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: 0, borderRadius: '0 0 12px 12px', fontSize: '13px' }}
                          >
                            {code}
                          </SyntaxHighlighter>
                        </div>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                          <table className="w-full text-sm">{children}</table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return <th className="border-b border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{children}</th>;
                    },
                    td({ children }) {
                      return <td className="border-b border-[var(--border)] px-3 py-2 text-sm">{children}</td>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {!isUser && hasFormBlock(message.content) && onFormSubmit && (
              <ChatForm content={message.content} onSubmit={onFormSubmit} />
            )}

            {hasArtifacts && onOpenArtifact && (
              <ArtifactFileList artifacts={message.artifacts!} onOpen={onOpenArtifact} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
