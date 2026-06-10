import { apiUrl } from './apiConfig';

export interface AgentEvent {
  type: 'text' | 'reasoning' | 'tool-start' | 'tool-result' | 'error' | 'done';
  content?: string;
  toolName?: string;
  args?: any;
  id?: string;
  result?: any;
  error?: string;
  finishReason?: string;
  usage?: any;
  reasoning?: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  args: any;
  result?: any;
  status: 'running' | 'done' | 'error';
}

export async function* streamAgentChat(
  messages: { role: string; content: string }[],
  options?: { model?: string; sessionId?: string; reasoning?: string; webSearchEnabled?: boolean; context?: string }
): AsyncGenerator<AgentEvent> {
  const sessionId = options?.sessionId || `session_${Date.now()}`;

  localStorage.setItem('AEGIS_SESSION_ID', sessionId);

  const res = await fetch(apiUrl('/api/unified/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      model: options?.model || localStorage.getItem(`API_MODEL_${localStorage.getItem('API_ACTIVE_PROVIDER') || 'OPENROUTER'}`) || 'openai/gpt-4o',
      sessionId,
      tools: true,
      reasoning: options?.reasoning || 'off',
      webSearchEnabled: options?.webSearchEnabled || false,
      ...(options?.context ? { context: options.context } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Agent erreur ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Stream non disponible');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;

      try {
        const event: AgentEvent = JSON.parse(data);
        yield event;
      } catch {}
    }
  }
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
