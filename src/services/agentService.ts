import { getApiBase } from './apiConfig';

export interface ToolEvent {
  type: 'tool-start' | 'tool-result' | 'tool-error';
  toolName?: string;
  args?: unknown;
  result?: unknown;
  id?: string;
}

export interface UnifiedStreamChunk {
  type: 'text' | 'tool-start' | 'tool-result' | 'error' | 'done';
  content?: string;
  toolName?: string;
  args?: unknown;
  result?: unknown;
  id?: string;
  error?: string;
  finishReason?: string;
  usage?: unknown;
}

export interface UnifiedChatOptions {
  messages: { role: string; content: string }[];
  model?: string;
  sessionId?: string;
  tools?: boolean;
  reasoning?: 'off' | 'low' | 'medium' | 'high' | 'max';
  webSearchEnabled?: boolean;
  context?: string;
  signal?: AbortSignal;
}

export async function* streamUnified(options: UnifiedChatOptions): AsyncGenerator<UnifiedStreamChunk> {
  const { messages, model, sessionId, tools, reasoning, webSearchEnabled, context, signal } = options;
  const base = getApiBase();

  const res = await fetch(`${base}/api/unified/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      model: model || localStorage.getItem(`API_MODEL_${localStorage.getItem('API_ACTIVE_PROVIDER') || 'OPENROUTER'}`) || 'openai/gpt-4o',
      sessionId: sessionId || localStorage.getItem('AEGIS_SESSION_ID') || '',
      tools: tools ?? true,
      reasoning: reasoning || 'off',
      webSearchEnabled: webSearchEnabled ?? false,
      context: context || '',
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Erreur ${res.status}: ${text}`);
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
        const parsed = JSON.parse(data) as UnifiedStreamChunk;
        yield parsed;
      } catch { /* skip */ }
    }
  }
}

export async function* streamChatWithTools(
  messages: { role: string; content: string }[],
  context?: string,
  signal?: AbortSignal,
): AsyncGenerator<UnifiedStreamChunk> {
  yield* streamUnified({ messages, context, tools: true, signal });
}
