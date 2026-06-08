export interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function callOpenRouter(
  prompt: string,
  options: OpenRouterOptions = {},
): Promise<string> {
  const apiKey = localStorage.getItem('API_KEY_OPENROUTER') ?? '';
  const apiUrl = localStorage.getItem('API_URL_OPENROUTER') ?? 'https://openrouter.ai/api/v1/chat/completions';
  const model = localStorage.getItem('API_MODEL_OPENROUTER') || options.model || 'openai/gpt-4o';

  if (!apiKey) throw new Error('Clé API OpenRouter manquante (API_KEY_OPENROUTER)');
  if (!apiUrl) throw new Error('URL OpenRouter manquante (API_URL_OPENROUTER)');

  const payload = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1024,
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}
