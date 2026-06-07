// src/services/openrouterService.ts
/**
 * Wrapper générique autour de l'API OpenRouter.
 * Les clés et le modèle sont stockés dans le localStorage par l'UI de configuration IA.
 *
 * Usage :
 *   const response = await callOpenRouter(prompt, { model: 'openrouter/anthropic/claude-3.5-sonnet' });
 *
 * Le wrapper gère :
 *   • Récupération des variables d'environnement (`OPENROUTER_API_KEY`, `OPENROUTER_API_URL`).
 *   • Envoi du prompt sous forme JSON conforme à l'API OpenRouter.
 *   • Gestion basique des erreurs et du timeout (10 s).
 *   • Retour du `content` du message assistant.
 *
 * 👉 FUTURE : ajoutez d’autres fournisseurs (Gemini, DeepSeek…) en adaptant la même interface.
 */

export interface OpenRouterOptions {
  /** Model identifier, e.g. "openrouter/anthropic/claude-3.5-sonnet" */
  model?: string;
  /** Optional temperature (0‑2) */
  temperature?: number;
  /** Max tokens for the response */
  maxTokens?: number;
}

export async function callOpenRouter(
  prompt: string,
  options: OpenRouterOptions = {},
): Promise<string> {
  const apiKey = localStorage.getItem('openrouter_api_key') ?? '';
  const apiUrl = localStorage.getItem('openrouter_api_url') ?? 'https://openrouter.ai/api/v1/chat/completions';

  if (!apiKey) {
    throw new Error('OpenRouter API key not set in localStorage (key: openrouter_api_key)');
  }

  const model = options.model ?? 'openrouter/anthropic/claude-3.5-sonnet';
  const payload = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1024,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json();
  // Selon le format OpenRouter, la réponse est dans data.choices[0].message.content
  const content = data?.choices?.[0]?.message?.content ?? '';
  return content;
}
