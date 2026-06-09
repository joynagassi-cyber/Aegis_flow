import { getApiBase } from './apiConfig';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  artifacts?: Artifact[];
  timestamp: number;
}

export interface Artifact {
  id: string;
  type: 'markdown' | 'html' | 'json' | 'csv' | 'pdf';
  title: string;
  content: string;
  language?: string;
}

function loadConfig() {
  return {
    apiKey: localStorage.getItem('API_KEY_OPENROUTER') || '',
    apiUrl: localStorage.getItem('API_URL_OPENROUTER') || 'https://openrouter.ai/api/v1/chat/completions',
    model: localStorage.getItem('API_MODEL_OPENROUTER') || 'openai/gpt-4o',
  };
}

export async function* streamChat(messages: { role: string; content: string }[]): AsyncGenerator<string> {
  const { apiKey, model } = loadConfig();

  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model, sessionId: localStorage.getItem('AEGIS_SESSION_ID') || '' }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Erreur ${res.status}: ${text}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      const json = await res.json();
      if (json.content) yield json.content;
      return;
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
          const parsed = JSON.parse(data);
          if (parsed.type === 'text' && parsed.content) {
            yield parsed.content;
          }
        } catch { /* skip */ }
      }
    }
  } catch (e) {
    if (!apiKey) throw new Error('Clé API OpenRouter manquante — configure dans Réglages > IA');
    throw e;
  }
}

export async function* streamChatDirect(messages: { role: string; content: string }[]): AsyncGenerator<string> {
  const { apiKey, apiUrl, model } = loadConfig();
  if (!apiKey) throw new Error('Clé API OpenRouter manquante — configure dans Réglages > IA');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 4096 }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Erreur ${response.status}: ${err}`);
  }

  const reader = response.body?.getReader();
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
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
        if (content) yield content;
      } catch { /* skip */ }
    }
  }
}

const blockRegex = /```(\w+)?\n([\s\S]*?)```/g;
const seenArtifacts = new Set<string>();

export function resetSeenArtifacts() {
  seenArtifacts.clear();
}

export function scanForArtifacts(fullContent: string): Artifact[] {
  const found: Artifact[] = [];
  let match;

  while ((match = blockRegex.exec(fullContent)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const code = match[2].trim();
    if (!code) continue;

    const hash = `${lang}:${code.slice(0, 64)}`;
    if (seenArtifacts.has(hash)) continue;
    seenArtifacts.add(hash);

    if (lang === 'html' || lang === 'htm') {
      found.push({ id: crypto.randomUUID(), type: 'html', title: 'Aperçu HTML', content: code, language: 'html' });
    } else if (lang === 'json') {
      try { JSON.parse(code); found.push({ id: crypto.randomUUID(), type: 'json', title: 'Données JSON', content: code, language: 'json' }); }
      catch { continue; }
    } else if (lang === 'csv') {
      found.push({ id: crypto.randomUUID(), type: 'csv', title: 'Tableau CSV', content: code, language: 'csv' });
    } else if (lang === 'markdown' || lang === 'md') {
      found.push({ id: crypto.randomUUID(), type: 'markdown', title: 'Document Markdown', content: code, language: 'markdown' });
    } else if (lang === 'svg') {
      found.push({ id: crypto.randomUUID(), type: 'html', title: 'Image SVG', content: code, language: 'html' });
    } else if (lang === 'mermaid') {
      found.push({ id: crypto.randomUUID(), type: 'markdown', title: 'Diagramme Mermaid', content: `\`\`\`mermaid\n${code}\n\`\`\``, language: 'markdown' });
    }
  }

  return found;
}

export function detectArtifact(content: string): Artifact | null {
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const code = match[2].trim();
    if (!code) continue;

    if (lang === 'html' || lang === 'htm') {
      return { id: crypto.randomUUID(), type: 'html', title: 'Aperçu HTML', content: code, language: 'html' };
    }
    if (lang === 'json') {
      try { JSON.parse(code); return { id: crypto.randomUUID(), type: 'json', title: 'Données JSON', content: code, language: 'json' }; }
      catch { continue; }
    }
    if (lang === 'csv') {
      return { id: crypto.randomUUID(), type: 'csv', title: 'Tableau CSV', content: code, language: 'csv' };
    }
    if (lang === 'markdown' || lang === 'md') {
      return { id: crypto.randomUUID(), type: 'markdown', title: 'Document Markdown', content: code, language: 'markdown' };
    }
  }

  if (content.includes('---') && content.includes('|')) {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length >= 2 && lines.some(l => l.includes('|'))) {
      return { id: crypto.randomUUID(), type: 'csv', title: 'Données tabulaires', content, language: 'csv' };
    }
  }

  return null;
}

export function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function searchWeb(query: string): Promise<string> {
  try {
    const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await r.json();
    const abstract = data.AbstractText || '';
    const results = (data.RelatedTopics || []).slice(0, 3).map((t: any) => t.Text || t.Result || '').filter(Boolean);
    return [abstract, ...results].filter(Boolean).join('\n').slice(0, 3000);
  } catch {
    return `Résultats de recherche pour: ${query}`;
  }
}
