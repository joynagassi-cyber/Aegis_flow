import { Terminal, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ToolCall } from '../services/agentClient';

interface TerminalOutputProps {
  toolCalls: ToolCall[];
}

export function TerminalOutput({ toolCalls }: TerminalOutputProps) {
  const bashCalls = toolCalls.filter(t => t.toolName === 'Bash');

  if (bashCalls.length === 0) return null;

  return (
    <div className="space-y-2">
      {bashCalls.map(tc => (
        <div key={tc.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[#0d1117]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[#161b22] px-3 py-1.5">
            <Terminal className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="text-[11px] font-bold text-[var(--text-muted)]">Terminal</span>
            {tc.status === 'running' && <Loader2 className="ml-auto h-3 w-3 animate-spin text-[var(--accent)]" />}
            {tc.status === 'done' && <CheckCircle className="ml-auto h-3 w-3 text-green-400" />}
            {tc.status === 'error' && <XCircle className="ml-auto h-3 w-3 text-red-400" />}
          </div>
          {tc.args?.command && (
            <div className="border-b border-[var(--border)] px-3 py-1.5">
              <span className="text-[11px] text-green-400">$ {tc.args.command}</span>
            </div>
          )}
          {tc.result && (
            <pre className="max-h-48 overflow-auto p-3 text-[11px] leading-5 text-[#c9d1d9] whitespace-pre-wrap font-mono">
              {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
            </pre>
          )}
          {tc.status === 'error' && (
            <pre className="max-h-48 overflow-auto p-3 text-[11px] leading-5 text-red-400 whitespace-pre-wrap font-mono">
              {tc.result || 'Erreur inconnue'}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
