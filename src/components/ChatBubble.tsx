import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SyntaxHighlighter, oneDark } from '../utils/syntaxHighlighter';
import { Copy, Check, Bot, User, Terminal, FileCode, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../services/chatService';
import type { ToolCall } from '../services/agentClient';

interface ChatMessageProps {
  message: ChatMessage;
  onSelectArtifact?: (content: string, lang: string) => void;
  toolCalls?: ToolCall[];
}

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

export function ChatBubble({ message, onSelectArtifact, toolCalls }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasToolCalls = toolCalls && toolCalls.length > 0;
  const hasContent = message.content && message.content.trim().length > 0;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${
        isUser ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'
      }`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-[var(--accent)]" />}
      </div>

      <div className={`group max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {hasToolCalls && <ToolCallBubble calls={toolCalls} />}
        {hasContent && (
          <div className={`rounded-2xl px-5 py-4 ${
            isUser
              ? 'bg-[var(--primary)]/8 border border-[var(--primary)]/15'
              : 'bg-[var(--surface)] border border-[var(--border)]'
          }`}>
            {isUser ? (
              <p className="text-sm leading-6 text-[var(--text)] whitespace-pre-wrap">{message.content}</p>
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
                              <button onClick={() => handleCopy(code)} className="rounded px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
                                {copied ? <Check className="h-3 w-3 text-[var(--success)]" /> : <Copy className="h-3 w-3" />}
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
          </div>
        )}
      </div>
    </div>
  );
}
