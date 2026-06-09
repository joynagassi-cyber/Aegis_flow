export interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function callOpenRouter(
  prompt: string,
  options: OpenRouterOptions = {},
): Promise<string> {
  const active = localStorage.getItem('API_ACTIVE_PROVIDER') || 'OPENROUTER';
  const apiKey = localStorage.getItem(`API_KEY_${active}`) ?? '';
  const apiUrl = localStorage.getItem(`API_URL_${active}`) ?? '';
  const model = localStorage.getItem(`API_MODEL_${active}`) || options.model || '';

  if (!apiKey) throw new Error(`Clé API manquante pour ${active} — configure dans Réglages > IA`);
  if (!apiUrl) throw new Error(`URL API manquante pour ${active} — configure dans Réglages > IA`);

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
